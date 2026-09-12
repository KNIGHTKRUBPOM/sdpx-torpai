from fastapi import APIRouter, Header
from sqlalchemy import delete

from src.config import Settings
from src.database import SessionLocal
from src.errors import DomainError
from src.models import Book, Loan, User
from src.seed import seed_database


def create_test_router(settings: Settings) -> APIRouter:
    router = APIRouter(prefix="/api/test", tags=["test-support"])

    @router.post("/reset")
    def reset_database(x_e2e_seed_token: str | None = Header(default=None)) -> dict[str, str]:
        if not settings.e2e_seed_token or x_e2e_seed_token != settings.e2e_seed_token:
            raise DomainError("INVALID_SEED_TOKEN", "Test seed token ไม่ถูกต้อง", 403)
        with SessionLocal() as session:
            session.execute(delete(Loan))
            session.execute(delete(Book))
            session.execute(delete(User))
            session.commit()
            seed_database(session, settings)
        return {"status": "reset"}

    return router
