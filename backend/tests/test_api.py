from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from main import app
from src.database import Base, get_db
from src.models import Book, User
from src.security import hash_password


def make_client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, expire_on_commit=False)
    Base.metadata.create_all(engine)
    session = TestingSession()
    session.add_all([
        User(id="lib-1", name="Librarian", email="library@uni.ac.th", password_hash=hash_password("Library123!"), role="librarian"),
        Book(id="book-1", isbn="9780262046305", title="Algorithms", author="Cormen", category="Computer", status="available"),
    ])
    session.commit()

    def override_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_db
    return TestClient(app), session


def login(client, email, password):
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_register_borrow_list_and_return_journey():
    client, session = make_client()
    with client:
        registered = client.post("/api/auth/register", json={"student_id": "65010001", "name": "Ada", "email": "ada@uni.ac.th", "password": "Password123!"})
        assert registered.status_code == 201
        headers = {"Authorization": f"Bearer {registered.json()['access_token']}"}
        borrowed = client.post("/api/loans", json={"isbn": "978-0-262-04630-5"}, headers=headers)
        assert borrowed.status_code == 201
        assert borrowed.json()["book"]["status"] == "borrowed"
        loans = client.get("/api/loans/me", headers=headers)
        assert len(loans.json()) == 1
        returned = client.post(f"/api/loans/{borrowed.json()['id']}/return", headers=headers)
        assert returned.status_code == 200
        assert returned.json()["book"]["status"] == "available"
    session.close()
    app.dependency_overrides.clear()


def test_librarian_can_add_book_and_student_cannot():
    client, session = make_client()
    with client:
        librarian_headers = login(client, "library@uni.ac.th", "Library123!")
        created = client.post("/api/books", json={"isbn": "9780134610993", "title": "AI", "author": "Russell", "category": "Computer"}, headers=librarian_headers)
        assert created.status_code == 201
        student = client.post("/api/auth/register", json={"student_id": "65010001", "name": "Ada", "email": "ada@uni.ac.th", "password": "Password123!"})
        student_headers = {"Authorization": f"Bearer {student.json()['access_token']}"}
        forbidden = client.post("/api/books", json={"isbn": "9781119454014", "title": "Physics", "author": "Halliday", "category": "Science"}, headers=student_headers)
        assert forbidden.status_code == 403
        assert forbidden.json()["error"]["code"] == "LIBRARIAN_REQUIRED"
    session.close()
    app.dependency_overrides.clear()


def test_api_requires_auth_and_uses_consistent_error_shape():
    client, session = make_client()
    with client:
        response = client.get("/api/books")
        assert response.status_code == 401
        assert response.json() == {"error": {"code": "AUTH_REQUIRED", "message": "กรุณาเข้าสู่ระบบ"}}
    session.close()
    app.dependency_overrides.clear()
