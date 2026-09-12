from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import get_settings
from src.database import Base, SessionLocal, engine
from src.errors import DomainError
from src.routers import auth, books, loans
from src.routers.test_support import create_test_router
from src.seed import seed_database


def error_payload(code: str, message: str) -> dict:
    return {"error": {"code": code, "message": message}}


def create_app() -> FastAPI:
    settings = get_settings()

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as session:
            seed_database(session, settings)
        yield

    app = FastAPI(title="UniLib API", version="1.0.0", description="Campus library catalog, authentication, and loan service.", lifespan=lifespan)
    app.add_middleware(CORSMiddleware, allow_origins=list(settings.allowed_origins), allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

    @app.exception_handler(DomainError)
    async def handle_domain_error(_request: Request, exc: DomainError) -> JSONResponse:
        return JSONResponse(content=error_payload(exc.code, exc.message), status_code=exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_request: Request, exc: RequestValidationError) -> JSONResponse:
        first = exc.errors()[0] if exc.errors() else None
        message = str(first.get("msg")) if first else "ข้อมูลไม่ถูกต้อง"
        return JSONResponse(content=error_payload("VALIDATION_ERROR", message), status_code=422)

    @app.exception_handler(HTTPException)
    async def handle_http_error(_request: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(content=error_payload("HTTP_ERROR", str(exc.detail)), status_code=exc.status_code)

    @app.get("/api/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/", include_in_schema=False)
    def root() -> dict[str, str]:
        return {"message": "UniLib API", "docs": "/docs"}

    app.include_router(auth.router)
    app.include_router(books.router)
    app.include_router(loans.router)
    if settings.app_env == "test":
        app.include_router(create_test_router(settings))
    return app
