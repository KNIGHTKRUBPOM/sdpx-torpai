import pytest
from tests.factories import make_book, make_user
from tests.fakes.fake_book_repo import FakeBookRepository
from src.services.borrow_service import BorrowService

@pytest.fixture
def available_book():
    return make_book(
        id="1",
        title="Introduction to Algorithms",
        isbn="978-0262046305",
        status="available"
    )

@pytest.fixture
def borrowed_book():
    return make_book(
        id="2",
        title="Principles of Physics",
        isbn="978-1119454014",
        status="borrowed",
        due_date="2026-07-25",
        borrowed_by="64010001"
    )

@pytest.fixture
def student():
    return make_user(
        id="64010001",
        name="John Doe",
        email="john@uni.ac.th",
        role="student"
    )

@pytest.fixture
def fake_book_repo(available_book, borrowed_book):
    return FakeBookRepository(initial_books=[available_book, borrowed_book])

@pytest.fixture
def borrow_service(fake_book_repo):
    return BorrowService(book_repo=fake_book_repo)
