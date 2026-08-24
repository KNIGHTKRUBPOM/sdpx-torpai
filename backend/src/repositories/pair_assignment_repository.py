from __future__ import annotations

from abc import ABC, abstractmethod

from src.domain.models import PairAssignment


class PairAssignmentRepository(ABC):
    """Storage boundary shared by production adapters and test fakes."""

    @abstractmethod
    def replace_for_criterion(
        self,
        assignment_id: str,
        criterion_id: str,
        assignments: list[PairAssignment],
    ) -> None:
        """Atomically replace generated assignments for one criterion."""

    @abstractmethod
    def list_for_criterion(
        self,
        assignment_id: str,
        criterion_id: str,
    ) -> list[PairAssignment]:
        """Return persisted pair assignments in stable order."""
