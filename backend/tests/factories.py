from src.repositories.book_repository import Book, User

"""
📌 หมายเหตุสำหรับเพื่อนในทีม (Factory Pattern):

1. ทำไมต้องใช้ Factory? (`make_book` / `make_user`)
   - หนังสือหรือผู้ใช้งาน 1 คนมีข้อมูลหลายฟิลด์ (เช่น ID, Title, Author, Category, ISBN, Status, Due Date, Borrowed By)
   - ถ้าทุกครั้งที่เขียน Test ต้องมาพิมพ์ข้อมูล 8 ฟิลด์ซ้ำๆ โค้ดจะยาวและรกรุงรัง
   - Factory ตัวนี้ต้มน้ำซุป/เตรียมค่า Default ไว้ให้แล้ว เวลาจะใช้งานแค่เรียก `make_book()` ได้เลย

2. วิธีใช้งาน Overrides:
   - ถ้าอยากได้หนังสือปกติ: `book = make_book()`
   - ถ้าอยากได้หนังสือที่ถูกยืมแล้ว: `borrowed_book = make_book(status="borrowed", borrowed_by="64010001")`
   - ใส่เฉพาะฟิลด์ที่เราอยากเปลี่ยน เท่านั้น! ช่วยให้โค้ดอ่านง่ายและดูแลรักษาง่าย
"""

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
