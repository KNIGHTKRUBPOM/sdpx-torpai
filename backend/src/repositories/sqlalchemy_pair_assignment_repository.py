from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from src.domain.models import PairAssignment
from src.persistence.models import PairAssignmentRecord
from src.repositories.pair_assignment_repository import PairAssignmentRepository


class SqlAlchemyPairAssignmentRepository(PairAssignmentRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def replace_for_criterion(
        self,
        assignment_id: str,
        criterion_id: str,
        assignments: list[PairAssignment],
    ) -> None:
        self.session.execute(
            delete(PairAssignmentRecord).where(
                PairAssignmentRecord.assignment_id == assignment_id,
                PairAssignmentRecord.criterion_id == criterion_id,
            )
        )
        self.session.add_all(
            [
                PairAssignmentRecord(
                    id=item.id,
                    assignment_id=item.assignment_id,
                    criterion_id=item.criterion_id,
                    evaluator_id=item.evaluator_id,
                    item_a_id=item.item_a_id,
                    item_b_id=item.item_b_id,
                    display_left_item_id=item.display_left_item_id,
                    generation=item.generation,
                )
                for item in assignments
            ]
        )
        self.session.flush()

    def list_for_criterion(
        self,
        assignment_id: str,
        criterion_id: str,
    ) -> list[PairAssignment]:
        records = self.session.scalars(
            select(PairAssignmentRecord)
            .where(
                PairAssignmentRecord.assignment_id == assignment_id,
                PairAssignmentRecord.criterion_id == criterion_id,
            )
            .order_by(PairAssignmentRecord.id)
        ).all()
        return [
            PairAssignment(
                id=item.id,
                assignment_id=item.assignment_id,
                criterion_id=item.criterion_id,
                evaluator_id=item.evaluator_id,
                item_a_id=item.item_a_id,
                item_b_id=item.item_b_id,
                display_left_item_id=item.display_left_item_id,
                generation=item.generation,
            )
            for item in records
        ]
