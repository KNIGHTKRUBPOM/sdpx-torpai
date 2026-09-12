from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from src.errors import conflict
from src.models import Book
from src.schemas import BookCreate


class BookService:
    def __init__(self, session: Session) -> None:
        self.session = session

    def search(self, query: str | None = None, category: str | None = None, status: str | None = None) -> list[Book]:
        statement = select(Book).order_by(Book.title)
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
        if self.session.scalar(select(Book).where(Book.isbn == request.isbn)):
            raise conflict("ISBN_ALREADY_EXISTS", "ISBN นี้มีอยู่ในระบบแล้ว")
        book = Book(**request.model_dump(), status="available")
        self.session.add(book)
        self.session.commit()
        self.session.refresh(book)
        return book
