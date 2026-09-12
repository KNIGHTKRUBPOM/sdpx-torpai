from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
from src.repositories.book_repository import BookRepository, Book

class BorrowResult(BaseModel):
    success: bool
    message: str
    book: Optional[Book] = None

class BorrowService:
    def __init__(self, book_repo: BookRepository):
        self.book_repo = book_repo

    def borrow_book(self, student_id: str, isbn: str) -> BorrowResult:
        if not student_id or not student_id.strip():
            return BorrowResult(success=False, message="Student ID is required")
            
        book = self.book_repo.get_by_isbn(isbn)
        if not book:
            return BorrowResult(success=False, message="Book not found")

        if book.status == "borrowed":
            return BorrowResult(success=False, message="Book is already borrowed")

        due_date = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
        book.status = "borrowed"
        book.due_date = due_date
        book.borrowed_by = student_id

        saved_book = self.book_repo.save(book)
        return BorrowResult(
            success=True,
            message=f"Book successfully borrowed by {student_id}",
            book=saved_book
        )

    def return_book(self, isbn: str) -> BorrowResult:
        book = self.book_repo.get_by_isbn(isbn)
        if not book:
            return BorrowResult(success=False, message="Book not found")

        if book.status == "available":
            return BorrowResult(success=False, message="Book is not currently borrowed")

        book.status = "available"
        book.due_date = None
        book.borrowed_by = None

        saved_book = self.book_repo.save(book)
        return BorrowResult(
            success=True,
            message="Book successfully returned",
            book=saved_book
        )
