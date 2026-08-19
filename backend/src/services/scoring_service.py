from __future__ import annotations

from decimal import Decimal

from src.domain.models import ComparisonStatus, CriterionScoreInput, WeightedPoint


class ScoringError(ValueError):
    pass


class ScoringService:
    CHOICE_POINTS: dict[int, tuple[Decimal, Decimal]] = {
        1: (Decimal("1.0"), Decimal("0.0")),
        2: (Decimal("0.8"), Decimal("0.2")),
        3: (Decimal("0.6"), Decimal("0.4")),
        4: (Decimal("0.4"), Decimal("0.6")),
        5: (Decimal("0.2"), Decimal("0.8")),
        6: (Decimal("0.0"), Decimal("1.0")),
    }

    @classmethod
    def choice_points(cls, choice: int) -> tuple[Decimal, Decimal]:
        try:
            return cls.CHOICE_POINTS[choice]
        except KeyError as error:
            raise ScoringError("choice must be an integer from 1 to 6") from error

    @classmethod
    def point_for_item(
        cls,
        choice: int,
        item_id: str,
        display_left_item_id: str,
        display_right_item_id: str,
    ) -> Decimal:
        left, right = cls.choice_points(choice)
        if item_id == display_left_item_id:
            return left
        if item_id == display_right_item_id:
            return right
        raise ScoringError("item must be one of the displayed pair items")

    @staticmethod
    def quality_index(points: list[WeightedPoint]) -> Decimal | None:
        submitted = [
            point
            for point in points
            if point.status == ComparisonStatus.SUBMITTED
        ]
        total_weight = sum(
            (point.evaluator_weight for point in submitted),
            start=Decimal("0"),
        )
        if not submitted:
            return None
        if total_weight <= 0:
            raise ScoringError("submitted comparison weight must be greater than zero")
        weighted_total = sum(
            (point.score * point.evaluator_weight for point in submitted),
            start=Decimal("0"),
        )
        return weighted_total / total_weight

    @staticmethod
    def score_ratio(
        quality_index: Decimal,
        floor: Decimal = Decimal("0.60"),
        ceiling: Decimal = Decimal("1.00"),
    ) -> Decimal:
        if not Decimal("0") <= quality_index <= Decimal("1"):
            raise ScoringError("quality index must be between zero and one")
        if not Decimal("0") <= floor < ceiling <= Decimal("1"):
            raise ScoringError("score band must satisfy 0 <= floor < ceiling <= 1")
        return floor + (ceiling - floor) * quality_index

    @classmethod
    def criterion_score(
        cls,
        criterion: CriterionScoreInput,
        side_max_score: Decimal,
        floor: Decimal = Decimal("0.60"),
        ceiling: Decimal = Decimal("1.00"),
    ) -> Decimal:
        if side_max_score < 0:
            raise ScoringError("side maximum score cannot be negative")
        ratio = cls.score_ratio(criterion.quality_index, floor, ceiling)
        return ratio * (criterion.weight_pct / Decimal("100")) * side_max_score

    @classmethod
    def component_score(
        cls,
        criteria: list[CriterionScoreInput],
        side_max_score: Decimal,
        floor: Decimal = Decimal("0.60"),
        ceiling: Decimal = Decimal("1.00"),
    ) -> Decimal:
        if not criteria and side_max_score == 0:
            return Decimal("0")
        weight_total = sum(
            (criterion.weight_pct for criterion in criteria),
            start=Decimal("0"),
        )
        if abs(weight_total - Decimal("100")) > Decimal("0.01"):
            raise ScoringError("criterion weights must total 100% ± 0.01")
        return sum(
            (
                cls.criterion_score(
                    criterion,
                    side_max_score,
                    floor=floor,
                    ceiling=ceiling,
                )
                for criterion in criteria
            ),
            start=Decimal("0"),
        )

    @staticmethod
    def participation_ratio(
        submitted_group: int,
        assigned_group: int,
        submitted_individual: int,
        assigned_individual: int,
    ) -> Decimal:
        values = (
            submitted_group,
            assigned_group,
            submitted_individual,
            assigned_individual,
        )
        if any(value < 0 for value in values):
            raise ScoringError("participation counts cannot be negative")
        if submitted_group > assigned_group or submitted_individual > assigned_individual:
            raise ScoringError("submitted comparisons cannot exceed assigned comparisons")
        total_assigned = assigned_group + assigned_individual
        if total_assigned == 0:
            return Decimal("1")
        return Decimal(submitted_group + submitted_individual) / Decimal(total_assigned)

    @staticmethod
    def participation_multiplier(
        participation_ratio: Decimal,
        completion_threshold: Decimal = Decimal("0.90"),
    ) -> Decimal:
        if not Decimal("0") <= participation_ratio <= Decimal("1"):
            raise ScoringError("participation ratio must be between zero and one")
        if not Decimal("0") < completion_threshold <= Decimal("1"):
            raise ScoringError("completion threshold must be in (0, 1]")
        return min(Decimal("1"), participation_ratio / completion_threshold)

    @classmethod
    def final_personal_score(
        cls,
        group_component: Decimal,
        individual_component: Decimal,
        participation_ratio: Decimal,
        completion_threshold: Decimal = Decimal("0.90"),
    ) -> Decimal:
        if group_component < 0 or individual_component < 0:
            raise ScoringError("score components cannot be negative")
        multiplier = cls.participation_multiplier(
            participation_ratio,
            completion_threshold,
        )
        return (group_component + individual_component) * multiplier
