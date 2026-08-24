from decimal import Decimal

from src.domain.models import (
    ComparisonStatus,
    CriterionScoreInput,
    Student,
    WeightedPoint,
)


def make_student(**overrides: str) -> Student:
    values = {"id": "student-01", "group_id": "group-a"}
    values.update(overrides)
    return Student(**values)


def make_classroom_students(
    group_sizes: tuple[int, ...] = (4, 4, 4),
) -> list[Student]:
    students: list[Student] = []
    sequence = 1
    for group_index, group_size in enumerate(group_sizes, start=1):
        for _ in range(group_size):
            students.append(
                make_student(
                    id=f"student-{sequence:02d}",
                    group_id=f"group-{group_index}",
                )
            )
            sequence += 1
    return students


def make_weighted_point(
    score: str = "0.8",
    evaluator_weight: str = "1.0",
    status: ComparisonStatus = ComparisonStatus.SUBMITTED,
) -> WeightedPoint:
    return WeightedPoint(
        score=Decimal(score),
        evaluator_weight=Decimal(evaluator_weight),
        status=status,
    )


def make_criterion(
    quality_index: str = "0.5",
    weight_pct: str = "100",
) -> CriterionScoreInput:
    return CriterionScoreInput(
        quality_index=Decimal(quality_index),
        weight_pct=Decimal(weight_pct),
    )
