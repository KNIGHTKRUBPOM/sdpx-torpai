from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from src.errors import DomainError, conflict
from src.models import User
from src.schemas import LoginRequest, RegisterRequest
from src.security import hash_password, verify_password


class AuthService:
    def __init__(self, session: Session) -> None:
        self.session = session

    def register_student(self, request: RegisterRequest) -> User:
        duplicate = self.session.scalar(
            select(User).where(or_(User.email == str(request.email), User.student_id == request.student_id))
        )
        if duplicate:
            field = "email" if duplicate.email == str(request.email) else "student_id"
            raise conflict("USER_ALREADY_EXISTS", f"{field} นี้ถูกใช้งานแล้ว")
        user = User(
            student_id=request.student_id,
            name=request.name,
            email=str(request.email),
            password_hash=hash_password(request.password),
            role="student",
        )
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def authenticate(self, request: LoginRequest) -> User:
        user = self.session.scalar(select(User).where(User.email == str(request.email)))
        if user is None or not verify_password(request.password, user.password_hash):
            raise DomainError("INVALID_CREDENTIALS", "Email หรือ password ไม่ถูกต้อง", 401)
        return user
