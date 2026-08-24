from __future__ import annotations

from src.domain.models import PairAssignment
from src.repositories.pair_assignment_repository import PairAssignmentRepository


class InMemoryPairAssignmentRepository(PairAssignmentRepository):
    """Local walking-skeleton adapter; PostgreSQL replaces this after WS-03."""

    def __init__(self) -> None:
        self._assignments: dict[tuple[str, str], list[PairAssignment]] = {}

    def replace_for_criterion(
        self,
        assignment_id: str,
        criterion_id: str,
        assignments: list[PairAssignment],
    ) -> None:
        self._assignments[(assignment_id, criterion_id)] = list(assignments)

    def list_for_criterion(
        self,
        assignment_id: str,
        criterion_id: str,
    ) -> list[PairAssignment]:
        return list(self._assignments.get((assignment_id, criterion_id), []))
