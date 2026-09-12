import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from src.database import get_db
from src.errors import DomainError
from src.models import User
from src.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise DomainError("AUTH_REQUIRED", "กรุณาเข้าสู่ระบบ", 401)
    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.PyJWTError as exc:
        raise DomainError("INVALID_TOKEN", "Session ไม่ถูกต้องหรือหมดอายุ", 401) from exc
    user = session.get(User, payload.get("sub"))
    if user is None:
        raise DomainError("INVALID_TOKEN", "ไม่พบบัญชีผู้ใช้", 401)
    return user


def require_librarian(user: User = Depends(get_current_user)) -> User:
    if user.role != "librarian":
        raise DomainError("LIBRARIAN_REQUIRED", "สิทธิ์นี้สำหรับบรรณารักษ์เท่านั้น", 403)
    return user


def require_student(user: User = Depends(get_current_user)) -> User:
    if user.role != "student":
        raise DomainError("STUDENT_REQUIRED", "สิทธิ์นี้สำหรับนักศึกษาเท่านั้น", 403)
    return user
