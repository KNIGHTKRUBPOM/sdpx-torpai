from sqlalchemy import select
from sqlalchemy.orm import Session

from src.config import Settings
from src.models import Book, User
from src.normalization import normalize_email, normalize_isbn
from src.security import hash_password

SAMPLE_BOOKS = (
    ("9780262046305", "Introduction to Algorithms", "Thomas H. Cormen", "วิทยาการคอมพิวเตอร์"),
    ("9780134610993", "Artificial Intelligence: A Modern Approach", "Stuart Russell", "วิทยาการคอมพิวเตอร์"),
    ("9781119454014", "Principles of Physics", "David Halliday", "วิทยาศาสตร์"),
)


def seed_database(session: Session, settings: Settings) -> None:
    if not settings.seed_demo_data:
        return
    if settings.librarian_email and settings.librarian_password:
        email = normalize_email(settings.librarian_email)
        if not session.scalar(select(User).where(User.email == email)):
            session.add(User(name=settings.librarian_name, email=email, password_hash=hash_password(settings.librarian_password), role="librarian"))
    for isbn, title, author, category in SAMPLE_BOOKS:
        normalized = normalize_isbn(isbn)
        if not session.scalar(select(Book).where(Book.isbn == normalized)):
            session.add(Book(isbn=normalized, title=title, author=author, category=category, status="available"))
    session.commit()
