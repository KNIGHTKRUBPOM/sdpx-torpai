from __future__ import annotations

import json
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.domain.models import ComparisonStatus, CriterionScoreInput, WeightedPoint
from src.persistence.models import (
    AssignmentRecord,
    ComparisonExclusionRecord,
    CriterionRecord,
    GroupRecord,
    MembershipRecord,
    PairAssignmentRecord,
    ScoreOverrideRecord,
    SubmissionRevisionRecord,
    UserRecord,
)
from src.services.scoring_service import ScoringService


class ScoreReportingService:
    """Database-backed score projection; all arithmetic remains in ScoringService."""

    def __init__(self, session: Session, assignment: AssignmentRecord) -> None:
        self.session = session
        self.assignment = assignment
        self.criteria = session.scalars(
            select(CriterionRecord)
            .where(CriterionRecord.assignment_id == assignment.id)
            .order_by(CriterionRecord.side, CriterionRecord.id)
        ).all()
        self.memberships = session.scalars(
            select(MembershipRecord).where(
                MembershipRecord.classroom_id == assignment.classroom_id,
                MembershipRecord.status == "ACTIVE",
            )
        ).all()
        self.role_by_user = {membership.user_id: membership.role for membership in self.memberships}
        self.excluded_pair_ids = set(
            session.scalars(
                select(ComparisonExclusionRecord.pair_assignment_id).where(
                    ComparisonExclusionRecord.assignment_id == assignment.id
                )
            ).all()
        )
        overrides = session.scalars(
            select(ScoreOverrideRecord)
            .where(ScoreOverrideRecord.assignment_id == assignment.id)
            .order_by(ScoreOverrideRecord.created_at.desc(), ScoreOverrideRecord.id.desc())
        ).all()
        self.override_by_item: dict[tuple[str, str], ScoreOverrideRecord] = {}
        for override in overrides:
            self.override_by_item.setdefault((override.side, override.item_id), override)

    def latest_answers(self, side: str) -> dict[str, dict[str, int]]:
        revisions = self.session.scalars(
            select(SubmissionRevisionRecord)
            .where(
                SubmissionRevisionRecord.assignment_id == self.assignment.id,
                SubmissionRevisionRecord.side == side,
            )
            .order_by(SubmissionRevisionRecord.evaluator_id, SubmissionRevisionRecord.revision.desc())
        ).all()
        result: dict[str, dict[str, int]] = {}
        for revision in revisions:
            if revision.evaluator_id in result:
                continue
            raw_answers = json.loads(revision.answers_json)
            result[revision.evaluator_id] = {
                str(pair_id): int(choice)
                for pair_id, choice in raw_answers.items()
                if isinstance(choice, int) and 1 <= choice <= 6
            }
        return result

    def _item_rows(self, side: str) -> list[dict[str, object]]:
        if side == "GROUP":
            return [
                {"itemId": group.id, "itemName": group.name, "groupId": group.id, "groupName": group.name}
                for group in self.session.scalars(
                    select(GroupRecord)
                    .where(GroupRecord.classroom_id == self.assignment.classroom_id)
                    .order_by(GroupRecord.name)
                ).all()
            ]
        users = {
            user.id: user
            for user in self.session.scalars(
                select(UserRecord).where(UserRecord.id.in_([membership.user_id for membership in self.memberships]))
            ).all()
        }
        groups = {
            group.id: group
            for group in self.session.scalars(
                select(GroupRecord).where(GroupRecord.classroom_id == self.assignment.classroom_id)
            ).all()
        }
        return [
            {
                "itemId": membership.user_id,
                "itemName": users[membership.user_id].display_name,
                "studentId": membership.student_id,
                "groupId": membership.group_id,
                "groupName": groups[membership.group_id].name if membership.group_id in groups else "",
            }
            for membership in self.memberships
            if membership.role == "STUDENT" and membership.user_id in users
        ]

    def item_scores(self, side: str) -> list[dict[str, object]]:
        criteria = [criterion for criterion in self.criteria if criterion.side == side]
        answers = self.latest_answers(side)
        maximum = Decimal(
            self.assignment.group_max_score if side == "GROUP" else self.assignment.individual_max_score
        )
        pairs_by_criterion = {
            criterion.id: self.session.scalars(
                select(PairAssignmentRecord).where(
                    PairAssignmentRecord.assignment_id == self.assignment.id,
                    PairAssignmentRecord.criterion_id == criterion.id,
                )
            ).all()
            for criterion in criteria
        }
        result: list[dict[str, object]] = []
        for item in self._item_rows(side):
            criterion_inputs: list[CriterionScoreInput] = []
            criterion_rows: list[dict[str, object]] = []
            flags: set[str] = set()
            for criterion in criteria:
                points: list[WeightedPoint] = []
                for pair in pairs_by_criterion[criterion.id]:
                    if pair.id in self.excluded_pair_ids:
                        continue
                    if item["itemId"] not in {pair.item_a_id, pair.item_b_id}:
                        continue
                    choice = answers.get(pair.evaluator_id, {}).get(pair.id)
                    if choice is None:
                        continue
                    right_id = pair.item_b_id if pair.display_left_item_id == pair.item_a_id else pair.item_a_id
                    evaluator_weight = (
                        Decimal(self.assignment.instructor_weight)
                        if self.role_by_user.get(pair.evaluator_id) in {"OWNER", "INSTRUCTOR"}
                        else Decimal("1")
                    )
                    points.append(
                        WeightedPoint(
                            score=ScoringService.point_for_item(
                                choice, str(item["itemId"]), pair.display_left_item_id, right_id
                            ),
                            evaluator_weight=evaluator_weight,
                            status=ComparisonStatus.SUBMITTED,
                        )
                    )
                quality = ScoringService.quality_index(points)
                weighted = None
                if quality is not None:
                    score_input = CriterionScoreInput(quality_index=quality, weight_pct=criterion.weight_pct)
                    criterion_inputs.append(score_input)
                    weighted = ScoringService.criterion_score(
                        score_input,
                        maximum,
                        Decimal(self.assignment.score_floor),
                        Decimal(self.assignment.score_ceiling),
                    )
                criterion_flags: list[str] = []
                if len(points) < self.assignment.min_comparisons:
                    criterion_flags.append("LOW_CONFIDENCE")
                    flags.add("LOW_CONFIDENCE")
                criterion_rows.append(
                    {
                        "criterionId": criterion.id,
                        "criterion": criterion.name,
                        "qualityIndex": float(quality) if quality is not None else None,
                        "comparisonCount": len(points),
                        "weightedScore": float(weighted.quantize(Decimal("0.001"))) if weighted is not None else None,
                        "flags": criterion_flags,
                    }
                )
            component = None
            if criteria and len(criterion_inputs) == len(criteria):
                component = ScoringService.component_score(
                    criterion_inputs,
                    maximum,
                    Decimal(self.assignment.score_floor),
                    Decimal(self.assignment.score_ceiling),
                )
            override = self.override_by_item.get((side, str(item["itemId"])))
            if override is not None:
                component = Decimal(override.override_value)
                flags.add("OVERRIDDEN")
            result.append(
                {
                    **item,
                    "criteria": criterion_rows,
                    "component": float(component.quantize(Decimal("0.001"))) if component is not None else None,
                    "flags": sorted(flags),
                }
            )
        return result

    def participation(self, evaluator_id: str) -> dict[str, object]:
        counts: dict[str, tuple[int, int]] = {}
        for side in ("GROUP", "INDIVIDUAL"):
            pair_ids = set(
                self.session.scalars(
                    select(PairAssignmentRecord.id)
                    .join(CriterionRecord, CriterionRecord.id == PairAssignmentRecord.criterion_id)
                    .where(
                        PairAssignmentRecord.assignment_id == self.assignment.id,
                        PairAssignmentRecord.evaluator_id == evaluator_id,
                        CriterionRecord.side == side,
                    )
                ).all()
            )
            submitted = len(pair_ids.intersection(self.latest_answers(side).get(evaluator_id, {})))
            counts[side] = (submitted, len(pair_ids))
        group_submitted, group_assigned = counts["GROUP"]
        individual_submitted, individual_assigned = counts["INDIVIDUAL"]
        ratio = ScoringService.participation_ratio(
            group_submitted,
            group_assigned,
            individual_submitted,
            individual_assigned,
        )
        multiplier = ScoringService.participation_multiplier(
            ratio, Decimal(self.assignment.completion_threshold)
        )
        return {
            "groupSubmitted": group_submitted,
            "groupAssigned": group_assigned,
            "individualSubmitted": individual_submitted,
            "individualAssigned": individual_assigned,
            "ratio": ratio,
            "multiplier": multiplier,
        }

    def individual_report(self) -> list[dict[str, object]]:
        groups = {row["itemId"]: row for row in self.item_scores("GROUP")}
        individuals = self.item_scores("INDIVIDUAL") if self.assignment.individual_max_score > 0 else []
        individuals_by_id = {row["itemId"]: row for row in individuals}
        rows: list[dict[str, object]] = []
        for item in self._item_rows("INDIVIDUAL"):
            participation = self.participation(str(item["itemId"]))
            group_component = groups.get(item["groupId"], {}).get("component")
            individual = individuals_by_id.get(item["itemId"])
            individual_component = individual.get("component") if individual else 0.0
            flags = set(groups.get(item["groupId"], {}).get("flags", []))
            if individual:
                flags.update(individual.get("flags", []))
            total = None
            if group_component is not None and individual_component is not None:
                total = ScoringService.final_personal_score(
                    Decimal(str(group_component)),
                    Decimal(str(individual_component)),
                    Decimal(participation["ratio"]),
                    Decimal(self.assignment.completion_threshold),
                )
            rows.append(
                {
                    **item,
                    "criteria": individual.get("criteria", []) if individual else [],
                    "groupComponent": group_component,
                    "individualComponent": individual_component,
                    "participationRatio": float(Decimal(participation["ratio"])),
                    "participationMultiplier": float(Decimal(participation["multiplier"])),
                    "total": float(total.quantize(Decimal("0.01"))) if total is not None else None,
                    "flags": sorted(flags),
                }
            )
        return rows

    def coverage_report(self) -> list[dict[str, object]]:
        criteria = {criterion.id: criterion for criterion in self.criteria}
        latest = {side: self.latest_answers(side) for side in ("GROUP", "INDIVIDUAL")}
        pairs = self.session.scalars(
            select(PairAssignmentRecord)
            .where(PairAssignmentRecord.assignment_id == self.assignment.id)
            .order_by(PairAssignmentRecord.criterion_id, PairAssignmentRecord.item_a_id, PairAssignmentRecord.item_b_id)
        ).all()
        grouped: dict[tuple[str, str, str], list[PairAssignmentRecord]] = {}
        for pair in pairs:
            grouped.setdefault((pair.criterion_id, pair.item_a_id, pair.item_b_id), []).append(pair)
        rows: list[dict[str, object]] = []
        for (criterion_id, item_a_id, item_b_id), assigned in grouped.items():
            criterion = criteria[criterion_id]
            submitted = sum(
                1 for pair in assigned if pair.id in latest[criterion.side].get(pair.evaluator_id, {})
            )
            rows.append(
                {
                    "side": criterion.side,
                    "criterionId": criterion.id,
                    "criterion": criterion.name,
                    "itemAId": item_a_id,
                    "itemBId": item_b_id,
                    "assignedCoverage": len(assigned),
                    "submittedCoverage": submitted,
                    "flags": ["LOW_COVERAGE"] if submitted < self.assignment.min_comparisons else [],
                }
            )
        return rows
