from src.repositories.book_repository import Book, User

def make_book(**overrides) -> Book:
    """
    Factory Function สำหรับสร้าง Book instance โดยมีค่า default และรองรับ overrides
    """
    defaults = {
        "id": "1",
        "title": "Introduction to Algorithms",
        "author": "Thomas H. Cormen",
        "category": "วิทยาการคอมพิวเตอร์",
        "isbn": "978-0262046305",
        "status": "available",
        "due_date": None,
        "borrowed_by": None
    }
    return Book(**{**defaults, **overrides})

def make_user(**overrides) -> User:
    """
    Factory Function สำหรับสร้าง User instance โดยมีค่า default และรองรับ overrides
    """
    defaults = {
        "id": "64010001",
        "name": "John Doe",
        "email": "john@uni.ac.th",
        "role": "student"
    }
    return User(**{**defaults, **overrides})
