from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies import get_current_user, require_librarian
from src.models import Book, User
from src.schemas import BookCreate, BookResponse
from src.services.book_service import BookService

router = APIRouter(prefix="/api/books", tags=["books"])


@router.get("", response_model=list[BookResponse])
def list_books(
    q: str | None = Query(default=None, max_length=255),
    category: str | None = Query(default=None, max_length=100),
    book_status: Literal["available", "borrowed"] | None = Query(default=None, alias="status"),
    _user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> list[Book]:
    return BookService(session).search(q, category, book_status)


@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def add_book(request: BookCreate, _librarian: User = Depends(require_librarian), session: Session = Depends(get_db)) -> Book:
    return BookService(session).create(request)
