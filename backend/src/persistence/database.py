from __future__ import annotations

import os
from collections.abc import AsyncGenerator

import anyio
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./paireval.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine_options = {
    "pool_pre_ping": True,
    "connect_args": connect_args,
}
if DATABASE_URL.startswith("sqlite") and ":memory:" in DATABASE_URL:
    engine_options["poolclass"] = StaticPool
elif not DATABASE_URL.startswith("sqlite"):
    # Docker sets a per-worker pool explicitly so total connections remain below
    # PostgreSQL's limit when multiple Uvicorn workers serve a deadline spike.
    engine_options.update(
        pool_size=int(os.getenv("DB_POOL_SIZE", "15")),
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "0")),
        pool_timeout=int(os.getenv("DB_POOL_TIMEOUT_SECONDS", "10")),
    )

engine = create_engine(DATABASE_URL, **engine_options)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
DB_REQUEST_CONCURRENCY = int(os.getenv("DB_REQUEST_CONCURRENCY", os.getenv("DB_POOL_SIZE", "15")))
db_request_slots = anyio.Semaphore(DB_REQUEST_CONCURRENCY)


class Base(DeclarativeBase):
    pass


async def get_session() -> AsyncGenerator[Session, None]:
    # Acquire asynchronously before creating a request-scoped session. This
    # prevents sync dependency stages from filling the SQLAlchemy pool while
    # completed handlers are waiting for their generator cleanup to run.
    async with db_request_slots:
        with SessionLocal() as session:
            yield session
