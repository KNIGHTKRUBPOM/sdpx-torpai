from decimal import ROUND_HALF_UP, Decimal

import pytest

from src.domain.models import ComparisonStatus
from src.services.scoring_service import ScoringError, ScoringService
from tests.factories import make_criterion, make_weighted_point


@pytest.mark.parametrize(
    ("choice", "expected_left", "expected_right"),
    [
        (1, "1.0", "0.0"),
        (2, "0.8", "0.2"),
        (3, "0.6", "0.4"),
        (4, "0.4", "0.6"),
        (5, "0.2", "0.8"),
        (6, "0.0", "1.0"),
    ],
)
def test_six_point_choices_are_complementary_without_neutral_value(
    choice,
    expected_left,
    expected_right,
):
    left, right = ScoringService.choice_points(choice)

    assert left == Decimal(expected_left)
    assert right == Decimal(expected_right)
    assert left + right == Decimal("1")
    assert left != right


def test_quality_index_uses_submitted_comparisons_and_fractional_weights_only():
    points = [
        make_weighted_point(score="1.0", evaluator_weight="1.0"),
        make_weighted_point(score="0.0", evaluator_weight="0.5"),
        make_weighted_point(
            score="0.0",
            evaluator_weight="100",
            status=ComparisonStatus.DRAFT,
        ),
    ]

    result = ScoringService.quality_index(points)

    assert result == Decimal("1") / Decimal("1.5")


def test_band_mapping_maps_quality_to_configurable_score_range():
    assert ScoringService.score_ratio(Decimal("0")) == Decimal("0.60")
    assert ScoringService.score_ratio(Decimal("0.5")) == Decimal("0.800")
    assert ScoringService.score_ratio(Decimal("1")) == Decimal("1.00")


def test_component_score_rejects_criteria_that_do_not_total_one_hundred_percent():
    criteria = [
        make_criterion(weight_pct="40"),
        make_criterion(weight_pct="59.98"),
    ]

    with pytest.raises(ScoringError, match="100%"):
        ScoringService.component_score(criteria, Decimal("15"))


def test_participation_policy_does_not_mutate_shared_group_component():
    group_component = Decimal("12.798")
    ratio = ScoringService.participation_ratio(6, 12, 3, 3)

    personal = ScoringService.final_personal_score(
        group_component,
        Decimal("3.660"),
        ratio,
    )

    assert ratio == Decimal("0.60")
    assert group_component == Decimal("12.798")
    assert personal == Decimal("10.97200000000000000000000000")


def test_prd_worked_example_is_protected_by_golden_scores():
    group_component = ScoringService.component_score(
        [
            make_criterion(quality_index="0.72", weight_pct="40"),
            make_criterion(quality_index="0.55", weight_pct="35"),
            make_criterion(quality_index="0.61", weight_pct="25"),
        ],
        Decimal("15"),
    )
    complete_individual = ScoringService.component_score(
        [
            make_criterion(quality_index="0.68", weight_pct="50"),
            make_criterion(quality_index="0.45", weight_pct="50"),
        ],
        Decimal("5"),
    )
    incomplete_individual = ScoringService.component_score(
        [
            make_criterion(quality_index="0.31", weight_pct="50"),
            make_criterion(quality_index="0.35", weight_pct="50"),
        ],
        Decimal("5"),
    )

    complete = ScoringService.final_personal_score(
        group_component,
        complete_individual,
        Decimal("1"),
    )
    incomplete = ScoringService.final_personal_score(
        group_component,
        incomplete_individual,
        Decimal("0.60"),
    )

    assert group_component == Decimal("12.79800")
    assert complete_individual == Decimal("4.13000")
    assert incomplete_individual == Decimal("3.66000")
    assert complete.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) == Decimal("16.93")
    assert incomplete.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) == Decimal("10.97")
