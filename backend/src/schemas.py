from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from src.normalization import normalize_email, normalize_isbn


class RegisterRequest(BaseModel):
    student_id: str = Field(min_length=5, max_length=30)
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("student_id", "name")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("email")
    @classmethod
    def normalize_email_value(cls, value: EmailStr) -> str:
        return normalize_email(str(value))


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email_value(cls, value: EmailStr) -> str:
        return normalize_email(str(value))


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    student_id: str | None
    name: str
    email: str
    role: Literal["student", "librarian"]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class BookCreate(BaseModel):
    isbn: str
    title: str = Field(min_length=1, max_length=255)
    author: str = Field(min_length=1, max_length=255)
    category: str = Field(min_length=1, max_length=100)

    @field_validator("isbn")
    @classmethod
    def validate_isbn(cls, value: str) -> str:
        return normalize_isbn(value)

    @field_validator("title", "author", "category")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()


class BookResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    isbn: str
    title: str
    author: str
    category: str
    status: Literal["available", "borrowed"]


class BorrowRequest(BaseModel):
    isbn: str

    @field_validator("isbn")
    @classmethod
    def validate_isbn(cls, value: str) -> str:
        return normalize_isbn(value)


class LoanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    borrowed_at: datetime
    due_at: datetime
    returned_at: datetime | None
    book: BookResponse
    user: UserResponse


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail
