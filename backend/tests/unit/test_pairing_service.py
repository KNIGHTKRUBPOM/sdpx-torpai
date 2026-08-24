from collections import Counter

import pytest

from src.services.pairing_service import PairingNotFeasibleError, PairingService
from tests.fakes.fake_pair_assignment_repo import FakePairAssignmentRepository


def test_feasibility_reduces_infeasible_coverage_with_numeric_reason(
    pairing_service,
    three_groups_of_four,
):
    result = pairing_service.solve_group_feasibility(
        three_groups_of_four,
        target_coverage=5,
        max_workload=8,
    )

    assert result.actual_coverage == 4
    assert result.workload == 1
    assert result.total_comparisons == 12
    assert result.reduced is True
    assert "5" in result.explanation
    assert "4" in result.explanation


def test_group_pair_generation_excludes_evaluators_own_group_and_duplicates(
    pairing_service,
    three_groups_of_four,
):
    _, assignments = pairing_service.generate_group_pairs(
        "assignment-1",
        "criterion-ux",
        three_groups_of_four,
        seed=20260819,
    )
    group_by_student = {
        student.id: student.group_id for student in three_groups_of_four
    }

    seen: set[tuple[str, str, str]] = set()
    for assignment in assignments:
        assert group_by_student[assignment.evaluator_id] not in {
            assignment.item_a_id,
            assignment.item_b_id,
        }
        identity = (
            assignment.evaluator_id,
            assignment.item_a_id,
            assignment.item_b_id,
        )
        assert identity not in seen
        seen.add(identity)


def test_group_pair_generation_balances_coverage_and_evaluator_workload(
    pairing_service,
    four_groups_of_four,
):
    _, assignments = pairing_service.generate_group_pairs(
        "assignment-1",
        "criterion-ux",
        four_groups_of_four,
        seed=42,
    )

    coverage = Counter(
        (assignment.item_a_id, assignment.item_b_id)
        for assignment in assignments
    )
    workload = Counter(assignment.evaluator_id for assignment in assignments)

    assert max(coverage.values()) - min(coverage.values()) <= 1
    assert max(workload.values()) - min(workload.values()) <= 1


def test_group_pair_generation_is_reproducible_for_same_seed(
    three_groups_of_four,
):
    first_repo = FakePairAssignmentRepository()
    second_repo = FakePairAssignmentRepository()

    _, first = PairingService(first_repo).generate_group_pairs(
        "assignment-1",
        "criterion-ux",
        three_groups_of_four,
        seed=99,
    )
    _, second = PairingService(second_repo).generate_group_pairs(
        "assignment-1",
        "criterion-ux",
        three_groups_of_four,
        seed=99,
    )

    assert first == second
    assert first_repo.list_for_criterion("assignment-1", "criterion-ux") == first


def test_group_evaluation_is_not_feasible_with_only_two_groups(
    pairing_service,
):
    from tests.factories import make_classroom_students

    with pytest.raises(PairingNotFeasibleError):
        pairing_service.solve_group_feasibility(make_classroom_students((4, 4)))


@pytest.mark.parametrize(
    ("group_size", "enabled", "workload", "minimum", "maximum", "capped"),
    [
        (2, False, 0, 0, 0, False),
        (3, True, 1, 1, 1, False),
        (5, True, 6, 3, 3, False),
        (8, True, 8, 2, 3, True),
    ],
)
def test_individual_feasibility_follows_group_size_and_workload_cap(
    group_size,
    enabled,
    workload,
    minimum,
    maximum,
    capped,
):
    result = PairingService.solve_individual_feasibility(group_size)

    assert result.enabled is enabled
    assert result.workload == workload
    assert result.min_coverage == minimum
    assert result.max_coverage == maximum
    assert result.workload_capped is capped
