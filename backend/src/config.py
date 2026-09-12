import os
from dataclasses import dataclass


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


def _database_url() -> str:
    value = os.getenv("DATABASE_URL", "sqlite:///./unilib.db")
    if value.startswith("postgres://"):
        return value.replace("postgres://", "postgresql+psycopg://", 1)
    if value.startswith("postgresql://"):
        return value.replace("postgresql://", "postgresql+psycopg://", 1)
    return value


@dataclass(frozen=True)
class Settings:
    app_env: str
    database_url: str
    jwt_secret: str
    jwt_expire_hours: int
    allowed_origins: tuple[str, ...]
    seed_demo_data: bool
    librarian_email: str | None
    librarian_password: str | None
    librarian_name: str
    e2e_seed_token: str | None


def get_settings() -> Settings:
    origins = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return Settings(
        app_env=os.getenv("APP_ENV", "development"),
        database_url=_database_url(),
        jwt_secret=os.getenv("JWT_SECRET", "development-only-change-me"),
        jwt_expire_hours=int(os.getenv("JWT_EXPIRE_HOURS", "12")),
        allowed_origins=tuple(item.strip() for item in origins.split(",") if item.strip()),
        seed_demo_data=_as_bool(os.getenv("SEED_DEMO_DATA"), True),
        librarian_email=os.getenv("LIBRARIAN_EMAIL"),
        librarian_password=os.getenv("LIBRARIAN_PASSWORD"),
        librarian_name=os.getenv("LIBRARIAN_NAME", "UniLib Librarian"),
        e2e_seed_token=os.getenv("E2E_SEED_TOKEN"),
    )
