from datetime import datetime, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from src.errors import conflict, not_found
from src.models import Book, Loan
from src.schemas import BookCreate


class BookService:
    def __init__(self, session: Session) -> None:
        self.session = session

    def search(self, query: str | None = None, category: str | None = None, status: str | None = None) -> list[Book]:
        statement = select(Book).where(Book.deleted_at.is_(None)).order_by(Book.title)
        if query and query.strip():
            term = f"%{query.strip().lower()}%"
            statement = statement.where(
                or_(func.lower(Book.title).like(term), func.lower(Book.author).like(term), func.lower(Book.isbn).like(term))
            )
        if category and category.strip():
            statement = statement.where(Book.category == category.strip())
        if status:
            statement = statement.where(Book.status == status)
        return list(self.session.scalars(statement))

    def create(self, request: BookCreate) -> Book:
        existing = self.session.scalar(select(Book).where(Book.isbn == request.isbn))
        if existing is not None and existing.deleted_at is None:
            raise conflict("ISBN_ALREADY_EXISTS", "ISBN นี้มีอยู่ในระบบแล้ว")
        if existing is not None:
            existing.title = request.title
            existing.author = request.author
            existing.category = request.category
            existing.status = "available"
            existing.deleted_at = None
            self.session.commit()
            self.session.refresh(existing)
            return existing
        book = Book(**request.model_dump(), status="available")
        self.session.add(book)
        self.session.commit()
        self.session.refresh(book)
        return book

    def delete(self, book_id: str) -> None:
        book = self.session.scalar(
            select(Book).where(Book.id == book_id, Book.deleted_at.is_(None)).with_for_update()
        )
        if book is None:
            raise not_found("BOOK_NOT_FOUND", "ไม่พบหนังสือ")
        active_loan = self.session.scalar(
            select(Loan.id).where(Loan.book_id == book.id, Loan.returned_at.is_(None)).limit(1)
        )
        if active_loan is not None:
            raise conflict("BOOK_HAS_ACTIVE_LOAN", "ไม่สามารถลบหนังสือที่กำลังถูกยืมได้")
        book.deleted_at = datetime.now(timezone.utc)
        self.session.commit()
