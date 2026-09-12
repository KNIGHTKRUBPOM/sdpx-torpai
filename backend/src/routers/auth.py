from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies import get_current_user
from src.models import User
from src.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from src.security import create_access_token
from src.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["authentication"])


def token_for(user: User) -> TokenResponse:
    return TokenResponse(access_token=create_access_token(user.id, user.role), user=UserResponse.model_validate(user))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, session: Session = Depends(get_db)) -> TokenResponse:
    return token_for(AuthService(session).register_student(request))


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, session: Session = Depends(get_db)) -> TokenResponse:
    return token_for(AuthService(session).authenticate(request))


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)) -> User:
    return user
