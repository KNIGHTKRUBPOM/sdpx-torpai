from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.database import Base
from src.errors import DomainError
from src.models import Book, Loan, User
from src.schemas import BookCreate, LoginRequest, RegisterRequest
from src.services.auth_service import AuthService
from src.services.book_service import BookService
from src.services.loan_service import LoanService


@pytest.fixture()
def session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine, expire_on_commit=False)() as db:
        yield db


@pytest.fixture()
def student(session):
    user = User(id="student-1", student_id="65010001", name="Ada", email="ada@uni.ac.th", password_hash="unused", role="student")
    session.add(user)
    session.commit()
    return user


@pytest.fixture()
def available_book(session):
    book = Book(id="book-1", isbn="9780262046305", title="Algorithms", author="Cormen", category="Computer", status="available")
    session.add(book)
    session.commit()
    return book


def test_register_hashes_password_and_login_normalizes_email(session):
    service = AuthService(session)
    user = service.register_student(RegisterRequest(student_id="65010002", name="Grace", email="GRACE@UNI.AC.TH", password="Password123!"))
    assert user.password_hash != "Password123!"
    assert service.authenticate(LoginRequest(email="grace@uni.ac.th", password="Password123!")).id == user.id


def test_register_rejects_duplicate_student_id(session):
    service = AuthService(session)
    request = RegisterRequest(student_id="65010002", name="Grace", email="grace@uni.ac.th", password="Password123!")
    service.register_student(request)
    with pytest.raises(DomainError, match="student_id") as error:
        service.register_student(RegisterRequest(student_id="65010002", name="Other", email="other@uni.ac.th", password="Password123!"))
    assert error.value.status_code == 409


def test_book_service_normalizes_and_rejects_duplicate_isbn(session):
    service = BookService(session)
    book = service.create(BookCreate(isbn="978-0-262-04630-5", title="Algorithms", author="Cormen", category="Computer"))
    assert book.isbn == "9780262046305"
    with pytest.raises(DomainError) as error:
        service.create(BookCreate(isbn="9780262046305", title="Duplicate", author="Other", category="Computer"))
    assert error.value.code == "ISBN_ALREADY_EXISTS"


def test_search_is_case_insensitive(session, available_book):
    assert BookService(session).search("algo") == [available_book]
    assert BookService(session).search("CORMEN") == [available_book]


def test_borrow_sets_due_date_and_return_restores_availability(session, student, available_book):
    now = datetime(2026, 9, 12, tzinfo=timezone.utc)
    service = LoanService(session, clock=lambda: now)
    loan = service.borrow(student, available_book.isbn)
    assert loan.due_at == datetime(2026, 9, 26, tzinfo=timezone.utc)
    assert loan.book.status == "borrowed"
    returned = service.return_loan(student, loan.id)
    assert returned.returned_at == now
    assert returned.book.status == "available"


def test_borrow_rejects_already_borrowed(session, student, available_book):
    service = LoanService(session)
    service.borrow(student, available_book.isbn)
    with pytest.raises(DomainError) as error:
        service.borrow(student, available_book.isbn)
    assert error.value.code == "BOOK_ALREADY_BORROWED"


def test_borrow_rejects_sixth_active_loan(session, student):
    service = LoanService(session)
    for index in range(5):
        book = Book(isbn=f"97800000000{index:02d}", title=f"Book {index}", author="Author", category="Test", status="borrowed")
        session.add(book)
        session.flush()
        session.add(Loan(user=student, book=book, due_at=datetime(2026, 9, 26, tzinfo=timezone.utc)))
    sixth = Book(isbn="9780000000999", title="Sixth", author="Author", category="Test", status="available")
    session.add(sixth)
    session.commit()
    with pytest.raises(DomainError) as error:
        service.borrow(student, sixth.isbn)
    assert error.value.code == "LOAN_LIMIT_REACHED"


def test_student_cannot_return_another_users_loan(session, student, available_book):
    owner = User(id="student-2", student_id="65010003", name="Owner", email="owner@uni.ac.th", password_hash="unused", role="student")
    session.add(owner)
    session.commit()
    loan = LoanService(session).borrow(owner, available_book.isbn)
    with pytest.raises(DomainError) as error:
        LoanService(session).return_loan(student, loan.id)
    assert error.value.code == "LOAN_NOT_OWNED"
