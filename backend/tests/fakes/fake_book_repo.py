from typing import Optional, List, Dict
from src.repositories.book_repository import BookRepository, Book

class FakeBookRepository(BookRepository):
    """
    Fake In-Memory Implementation ของ BookRepository
    สืบทอดจาก BookRepository (ABC) เพื่อให้แน่ใจว่า Implement Signature เดียวกับของจริง 100%
    """
    def __init__(self, initial_books: Optional[List[Book]] = None):
        self._books_by_id: Dict[str, Book] = {}
        self._books_by_isbn: Dict[str, Book] = {}

        if initial_books:
            for book in initial_books:
                self.save(book)

    def get_by_id(self, book_id: str) -> Optional[Book]:
        book = self._books_by_id.get(book_id)
        return book.model_copy() if book else None

    def get_by_isbn(self, isbn: str) -> Optional[Book]:
        book = self._books_by_isbn.get(isbn)
        return book.model_copy() if book else None

    def find_available(self, category: Optional[str] = None) -> List[Book]:
        available_books = [
            b.model_copy() for b in self._books_by_id.values() 
            if b.status == "available"
        ]
        if category and category != "ทั้งหมด":
            available_books = [b for b in available_books if b.category == category]
        return available_books

    def save(self, book: Book) -> Book:
        copied_book = book.model_copy()
        self._books_by_id[copied_book.id] = copied_book
        self._books_by_isbn[copied_book.isbn] = copied_book
        return copied_book.model_copy()

    def get_all(self) -> List[Book]:
        return [b.model_copy() for b in self._books_by_id.values()]
