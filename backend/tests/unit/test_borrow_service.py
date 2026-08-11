import pytest

def test_borrow_book_confirmed_when_book_available(borrow_service, available_book, student):
    """
    ทดสอบกฎ: หนังสือที่มีสถานะ available เมื่อยืมด้วย Student ID ที่ถูกต้อง ต้องยืมสำเร็จ
    """
    # Act
    result = borrow_service.borrow_book(student_id=student.id, isbn=available_book.isbn)

    # Assert
    assert result.success is True
    assert result.book is not None
    assert result.book.status == "borrowed"
    assert result.book.borrowed_by == student.id
    assert result.book.due_date is not None

def test_borrow_book_rejected_when_book_already_borrowed(borrow_service, borrowed_book, student):
    """
    ทดสอบกฎ: หนังสือที่มีสถานะ borrowed อยู่แล้ว ไม่สามารถทำการยืมซ้ำได้
    """
    # Act
    result = borrow_service.borrow_book(student_id=student.id, isbn=borrowed_book.isbn)

    # Assert
    assert result.success is False
    assert "already borrowed" in result.message.lower()

def test_borrow_book_rejected_when_isbn_not_found(borrow_service, student):
    """
    ทดสอบกฎ: หากไม่พบ ISBN ในระบบ การยืมหนังสือต้องถูกปฏิเสธ
    """
    # Act
    result = borrow_service.borrow_book(student_id=student.id, isbn="999-0000000000")

    # Assert
    assert result.success is False
    assert "not found" in result.message.lower()

def test_borrow_book_rejected_when_student_id_missing(borrow_service, available_book):
    """
    ทดสอบกฎ: การยืมหนังสือโดยไม่มี Student ID ต้องถูกปฏิเสธ
    """
    # Act
    result = borrow_service.borrow_book(student_id="", isbn=available_book.isbn)

    # Assert
    assert result.success is False
    assert "required" in result.message.lower()

def test_return_book_confirmed_when_book_borrowed(borrow_service, borrowed_book):
    """
    ทดสอบกฎ: คืนหนังสือที่มีสถานะ borrowed สำเร็จ ต้องเปลี่ยนสถานะเป็น available และเคลียร์ due_date
    """
    # Act
    result = borrow_service.return_book(isbn=borrowed_book.isbn)

    # Assert
    assert result.success is True
    assert result.book is not None
    assert result.book.status == "available"
    assert result.book.due_date is None
    assert result.book.borrowed_by is None

def test_return_book_rejected_when_book_already_available(borrow_service, available_book):
    """
    ทดสอบกฎ: การคืนหนังสือที่มีสถานะ available อยู่แล้ว ต้องถูกปฏิเสธ
    """
    # Act
    result = borrow_service.return_book(isbn=available_book.isbn)

    # Assert
    assert result.success is False
    assert "not currently borrowed" in result.message.lower()

def test_return_book_rejected_when_isbn_not_found(borrow_service):
    """
    ทดสอบกฎ: การคืนหนังสือด้วย ISBN ที่ไม่มีในระบบ ต้องถูกปฏิเสธ
    """
    # Act
    result = borrow_service.return_book(isbn="999-0000000000")

    # Assert
    assert result.success is False
    assert "not found" in result.message.lower()

def test_fake_repo_find_available_returns_only_available_books(fake_book_repo):
    """
    ทดสอบกฎ: find_available() ของ Repository ต้องคืนค่าเฉพาะหนังสือที่สถานะเป็น available
    """
    # Act
    available_books = fake_book_repo.find_available()

    # Assert
    assert len(available_books) == 1
    assert available_books[0].isbn == "978-0262046305"

def test_fake_repo_get_by_id_returns_matching_book(fake_book_repo):
    """
    ทดสอบกฎ: get_by_id() ของ Repository ต้องคืนค่าหนังสือที่ ID ตรงกัน
    """
    # Act
    book = fake_book_repo.get_by_id("1")

    # Assert
    assert book is not None
    assert book.title == "Introduction to Algorithms"
