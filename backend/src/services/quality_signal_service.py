from __future__ import annotations

import hashlib
import json
from collections import Counter, defaultdict
from itertools import combinations

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.persistence.models import AssignmentRecord, CriterionRecord, PairAssignmentRecord, SubmissionRevisionRecord
from src.services.scoring_service import ScoringService


class QualitySignalService:
    """Calculate advisory signals only; this service never changes score weights."""

    def __init__(self, session: Session, assignment: AssignmentRecord) -> None:
        self.session = session
        self.assignment = assignment
        self.criteria = {
            item.id: item
            for item in session.scalars(
                select(CriterionRecord).where(CriterionRecord.assignment_id == assignment.id)
            ).all()
        }
        self.pairs = {
            item.id: item
            for item in session.scalars(
                select(PairAssignmentRecord).where(PairAssignmentRecord.assignment_id == assignment.id)
            ).all()
        }

    def pseudonym(self, evaluator_id: str) -> str:
        digest = hashlib.sha256(
            f"{self.assignment.classroom_id}:{evaluator_id}".encode("utf-8")
        ).hexdigest()[:10].upper()
        return f"RATER-{digest}"

    def _latest_revisions(self) -> list[SubmissionRevisionRecord]:
        revisions = self.session.scalars(
            select(SubmissionRevisionRecord)
            .where(SubmissionRevisionRecord.assignment_id == self.assignment.id)
            .order_by(
                SubmissionRevisionRecord.evaluator_id,
                SubmissionRevisionRecord.side,
                SubmissionRevisionRecord.revision.desc(),
            )
        ).all()
        latest: dict[tuple[str, str], SubmissionRevisionRecord] = {}
        for revision in revisions:
            latest.setdefault((revision.evaluator_id, revision.side), revision)
        return list(latest.values())

    @staticmethod
    def kendalls_w(ratings: list[dict[str, float]]) -> float | None:
        """Return tie-corrected Kendall's W for raters scoring the same items."""
        if len(ratings) < 2:
            return None
        item_ids = sorted(set.intersection(*(set(rating) for rating in ratings)))
        if len(item_ids) < 3:
            return None
        rank_rows: list[dict[str, float]] = []
        tie_correction = 0.0
        for rating in ratings:
            ordered = sorted(item_ids, key=lambda item_id: rating[item_id])
            ranks: dict[str, float] = {}
            cursor = 0
            while cursor < len(ordered):
                end = cursor + 1
                while end < len(ordered) and rating[ordered[end]] == rating[ordered[cursor]]:
                    end += 1
                average_rank = ((cursor + 1) + end) / 2
                for item_id in ordered[cursor:end]:
                    ranks[item_id] = average_rank
                tie_size = end - cursor
                if tie_size > 1:
                    tie_correction += tie_size**3 - tie_size
                cursor = end
            rank_rows.append(ranks)
        rater_count = len(rank_rows)
        item_count = len(item_ids)
        rank_sums = [sum(row[item_id] for row in rank_rows) for item_id in item_ids]
        expected = rater_count * (item_count + 1) / 2
        squared_deviation = sum((rank_sum - expected) ** 2 for rank_sum in rank_sums)
        denominator = rater_count**2 * (item_count**3 - item_count) - rater_count * tie_correction
        if denominator <= 0:
            return None
        return max(0.0, min(1.0, 12 * squared_deviation / denominator))

    def signals(self) -> list[dict[str, object]]:
        signals: list[dict[str, object]] = []
        agreement_scores: dict[str, dict[str, dict[str, list[float]]]] = defaultdict(
            lambda: defaultdict(lambda: defaultdict(list))
        )
        for revision in self._latest_revisions():
            answers = {str(key): int(value) for key, value in json.loads(revision.answers_json).items()}
            if not answers:
                continue
            pseudonym = self.pseudonym(revision.evaluator_id)
            counts = Counter(answers.values())
            straight_ratio = max(counts.values()) / len(answers)
            if len(answers) >= 3 and straight_ratio > 0.80:
                signals.append(
                    {"signal": "STRAIGHT_LINING", "rater": pseudonym, "value": round(straight_ratio, 3), "threshold": 0.80, "pairIds": sorted(answers), "action": "ทบทวนด้วยตา"}
                )
            left_count = sum(choice <= 3 for choice in answers.values())
            position_ratio = max(left_count, len(answers) - left_count) / len(answers)
            if len(answers) >= 3 and position_ratio > 0.80:
                signals.append(
                    {"signal": "POSITION_BIAS", "rater": pseudonym, "value": round(position_ratio, 3), "threshold": 0.80, "pairIds": sorted(answers), "action": "ทบทวนด้วยตา"}
                )
            metadata = json.loads(revision.metadata_json or "{}")
            raw_times = metadata.get("timeOnTaskMs", {})
            times = [int(raw_times[pair_id]) for pair_id in answers if int(raw_times.get(pair_id, 0)) > 0]
            if times and len(times) == len(answers):
                average_ms = sum(times) / len(times)
                if average_ms < 3000:
                    signals.append(
                        {"signal": "SPEED_RUN", "rater": pseudonym, "valueMs": round(average_ms), "thresholdMs": 3000, "pairIds": sorted(answers), "action": "ทบทวนด้วยตา"}
                    )
            by_criterion: dict[str, dict[tuple[str, str], str]] = defaultdict(dict)
            item_scores: dict[str, list[float]] = defaultdict(list)
            for pair_id, choice in answers.items():
                pair = self.pairs.get(pair_id)
                if pair is None:
                    continue
                right_id = pair.item_b_id if pair.display_left_item_id == pair.item_a_id else pair.item_a_id
                winner, loser = (
                    (pair.display_left_item_id, right_id) if choice <= 3 else (right_id, pair.display_left_item_id)
                )
                by_criterion[pair.criterion_id][tuple(sorted((winner, loser)))] = winner
                agreement_scores[pair.criterion_id][revision.evaluator_id][pair.item_a_id].append(
                    float(ScoringService.point_for_item(choice, pair.item_a_id, pair.display_left_item_id, right_id))
                )
                agreement_scores[pair.criterion_id][revision.evaluator_id][pair.item_b_id].append(
                    float(ScoringService.point_for_item(choice, pair.item_b_id, pair.display_left_item_id, right_id))
                )
                if revision.side == "INDIVIDUAL":
                    item_scores[pair.item_a_id].append(
                        float(ScoringService.point_for_item(choice, pair.item_a_id, pair.display_left_item_id, right_id))
                    )
                    item_scores[pair.item_b_id].append(
                        float(ScoringService.point_for_item(choice, pair.item_b_id, pair.display_left_item_id, right_id))
                    )
            checked_triples = 0
            cyclic_triples = 0
            for criterion_edges in by_criterion.values():
                items = sorted({item for pair in criterion_edges for item in pair})
                for triple in combinations(items, 3):
                    pair_keys = [tuple(sorted(pair)) for pair in combinations(triple, 2)]
                    if not all(key in criterion_edges for key in pair_keys):
                        continue
                    checked_triples += 1
                    outgoing = Counter(criterion_edges[key] for key in pair_keys)
                    if set(outgoing.values()) == {1}:
                        cyclic_triples += 1
            if checked_triples and cyclic_triples / checked_triples > 0.20:
                signals.append(
                    {"signal": "INTRANSITIVITY", "rater": pseudonym, "value": round(cyclic_triples / checked_triples, 3), "threshold": 0.20, "pairIds": sorted(answers), "action": "ทบทวนด้วยตา"}
                )
            means = {item_id: sum(values) / len(values) for item_id, values in item_scores.items() if values}
            if len(means) >= 3:
                mean = sum(means.values()) / len(means)
                variance = sum((value - mean) ** 2 for value in means.values()) / len(means)
                deviation = variance**0.5
                if deviation:
                    highest_item, highest = max(means.items(), key=lambda item: item[1])
                    z_score = (highest - mean) / deviation
                    if z_score > 2:
                        signals.append(
                            {"signal": "SELF_GROUP_FAVORITISM", "rater": pseudonym, "itemPseudonym": hashlib.sha256(highest_item.encode()).hexdigest()[:10].upper(), "value": round(z_score, 3), "threshold": 2, "pairIds": sorted(answers), "action": "ทบทวนด้วยตา"}
                        )
        for criterion_id, evaluator_scores in agreement_scores.items():
            cohorts: dict[frozenset[str], list[dict[str, float]]] = defaultdict(list)
            for item_scores in evaluator_scores.values():
                means = {item_id: sum(values) / len(values) for item_id, values in item_scores.items() if values}
                if len(means) >= 3:
                    cohorts[frozenset(means)].append(means)
            eligible = [ratings for ratings in cohorts.values() if len(ratings) >= 2]
            if not eligible:
                continue
            weighted_values = [
                (self.kendalls_w(ratings), len(ratings), len(ratings[0]))
                for ratings in eligible
            ]
            usable = [(value, raters, items) for value, raters, items in weighted_values if value is not None]
            if usable:
                total_raters = sum(raters for _, raters, _ in usable)
                agreement = sum(value * raters for value, raters, _ in usable) / total_raters
                if agreement < 0.20:
                    criterion = self.criteria[criterion_id]
                    signals.append(
                        {
                            "signal": "LOW_AGREEMENT",
                            "criterion": criterion.name,
                            "side": criterion.side,
                            "value": round(agreement, 3),
                            "threshold": 0.20,
                            "raterCount": total_raters,
                            "action": "criterion อาจกำกวม ต้องแก้คำอธิบาย",
                        }
                    )
        return signals
