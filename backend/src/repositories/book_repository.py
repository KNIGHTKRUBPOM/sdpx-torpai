from abc import ABC, abstractmethod
from typing import Optional, List
from pydantic import BaseModel

class Book(BaseModel):
    id: str
    title: str
    author: str
    category: str
    isbn: str
    status: str = "available"  # "available" | "borrowed"
    due_date: Optional[str] = None
    borrowed_by: Optional[str] = None

class User(BaseModel):
    id: str
    name: str
    email: str
    role: str = "student"  # "student" | "faculty" | "librarian"

class BookRepository(ABC):
    """
    Interface หลักสำหรับ Book Repository (ใช้ร่วมกันทั้ง Production & Fake Implementation)
    """

    @abstractmethod
    def get_by_id(self, book_id: str) -> Optional[Book]:
        pass

    @abstractmethod
    def get_by_isbn(self, isbn: str) -> Optional[Book]:
        pass

    @abstractmethod
    def find_available(self, category: Optional[str] = None) -> List[Book]:
        pass

    @abstractmethod
    def save(self, book: Book) -> Book:
        pass

    @abstractmethod
    def get_all(self) -> List[Book]:
        pass
