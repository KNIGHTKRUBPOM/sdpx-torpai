from src.domain.models import PairAssignment
from src.repositories.pair_assignment_repository import PairAssignmentRepository


class FakePairAssignmentRepository(PairAssignmentRepository):
    def __init__(self) -> None:
        self._data: dict[tuple[str, str], list[PairAssignment]] = {}
        self.replace_calls = 0

    def replace_for_criterion(
        self,
        assignment_id: str,
        criterion_id: str,
        assignments: list[PairAssignment],
    ) -> None:
        self.replace_calls += 1
        self._data[(assignment_id, criterion_id)] = list(assignments)

    def list_for_criterion(
        self,
        assignment_id: str,
        criterion_id: str,
    ) -> list[PairAssignment]:
        return list(self._data.get((assignment_id, criterion_id), []))
