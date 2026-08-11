from typing import Optional, List, Dict
from src.repositories.book_repository import BookRepository, Book

class FakeBookRepository(BookRepository):
    """
    📌 หมายเหตุสำหรับเพื่อนในทีม (Fake Repository Pattern):
    
    1. ทำไมถึงต้องมีไฟล์นี้?
       - ปกติถ้าต่อ Database จริง (PostgreSQL) ตอนรัน Test จะช้ามาก (ใช้เวลาหลายวินาที) และต้องล้างข้อมูลขยะทิ้งทุกครั้ง
       - ไฟล์นี้จำลองฐานข้อมูลโดยเก็บลงใน Memory (Python Dictionary) ทำให้รัน Test ได้เร็วสุดๆ (0.01 วินาที)

    2. ทำไมต้องสืบทอดจาก `BookRepository` (Class เดียวกับของจริง)?
       - เพื่อบังคับให้ทั้ง FakeRepo (สำหรับทดสอบ) และ PostgresRepo (ของจริงบน Production) มี Method Signatures เดียวกันเป๊ะ 100%
       - ทำให้ Service (เช่น BorrowService) สลับไปใช้ FakeRepo ตอนทดสอบได้ทันที โดยที่โค้ดไม่พัง
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
