from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

from src.config import get_settings


class Base(DeclarativeBase):
    pass


def _create_engine():
    url = get_settings().database_url
    connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
    poolclass = StaticPool if url in {"sqlite://", "sqlite:///:memory:"} else None
    return create_engine(url, pool_pre_ping=True, connect_args=connect_args, poolclass=poolclass)


engine = _create_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
