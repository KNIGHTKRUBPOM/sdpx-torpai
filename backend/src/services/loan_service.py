from collections.abc import Callable
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from src.errors import conflict, forbidden, not_found
from src.models import Book, Loan, User


class LoanService:
    def __init__(self, session: Session, clock: Callable[[], datetime] | None = None) -> None:
        self.session = session
        self.clock = clock or (lambda: datetime.now(timezone.utc))

    def borrow(self, user: User, isbn: str) -> Loan:
        book = self.session.scalar(
            select(Book).where(Book.isbn == isbn, Book.deleted_at.is_(None)).with_for_update()
        )
        if book is None:
            raise not_found("BOOK_NOT_FOUND", "ไม่พบหนังสือจาก ISBN นี้")
        if book.status != "available":
            raise conflict("BOOK_ALREADY_BORROWED", "หนังสือถูกยืมอยู่แล้ว")
        active_count = self.session.scalar(
            select(func.count(Loan.id)).where(Loan.user_id == user.id, Loan.returned_at.is_(None))
        )
        if (active_count or 0) >= 5:
            raise conflict("LOAN_LIMIT_REACHED", "ยืมหนังสือได้สูงสุด 5 เล่ม")

        borrowed_at = self.clock()
        loan = Loan(user=user, book=book, borrowed_at=borrowed_at, due_at=borrowed_at + timedelta(days=14))
        book.status = "borrowed"
        self.session.add(loan)
        self.session.commit()
        return self.get_by_id(loan.id)

    def get_by_id(self, loan_id: str) -> Loan:
        loan = self.session.scalar(
            select(Loan).options(joinedload(Loan.book), joinedload(Loan.user)).where(Loan.id == loan_id)
        )
        if loan is None:
            raise not_found("LOAN_NOT_FOUND", "ไม่พบรายการยืม")
        return loan

    def list_for_user(self, user_id: str, active_only: bool = True) -> list[Loan]:
        statement = (
            select(Loan)
            .options(joinedload(Loan.book), joinedload(Loan.user))
            .where(Loan.user_id == user_id)
            .order_by(Loan.borrowed_at.desc())
        )
        if active_only:
            statement = statement.where(Loan.returned_at.is_(None))
        return list(self.session.scalars(statement))

    def list_all(self, active_only: bool = False) -> list[Loan]:
        statement = select(Loan).options(joinedload(Loan.book), joinedload(Loan.user)).order_by(Loan.borrowed_at.desc())
        if active_only:
            statement = statement.where(Loan.returned_at.is_(None))
        return list(self.session.scalars(statement))

    def return_loan(self, actor: User, loan_id: str) -> Loan:
        loan = self.get_by_id(loan_id)
        if actor.role != "librarian" and loan.user_id != actor.id:
            raise forbidden("LOAN_NOT_OWNED", "ไม่สามารถคืนหนังสือของผู้ใช้อื่นได้")
        if loan.returned_at is not None:
            raise conflict("LOAN_ALREADY_RETURNED", "รายการนี้ถูกคืนแล้ว")
        loan.returned_at = self.clock()
        loan.book.status = "available"
        self.session.commit()
        return self.get_by_id(loan.id)
