from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies import get_current_user, require_librarian, require_student
from src.models import Loan, User
from src.schemas import BorrowRequest, LoanResponse
from src.services.loan_service import LoanService

router = APIRouter(prefix="/api/loans", tags=["loans"])


@router.post("", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
def borrow(request: BorrowRequest, student: User = Depends(require_student), session: Session = Depends(get_db)) -> Loan:
    return LoanService(session).borrow(student, request.isbn)


@router.get("/me", response_model=list[LoanResponse])
def my_loans(active_only: bool = Query(default=True), user: User = Depends(get_current_user), session: Session = Depends(get_db)) -> list[Loan]:
    return LoanService(session).list_for_user(user.id, active_only)


@router.get("", response_model=list[LoanResponse])
def all_loans(active_only: bool = Query(default=False), _librarian: User = Depends(require_librarian), session: Session = Depends(get_db)) -> list[Loan]:
    return LoanService(session).list_all(active_only)


@router.post("/{loan_id}/return", response_model=LoanResponse)
def return_loan(loan_id: str, actor: User = Depends(get_current_user), session: Session = Depends(get_db)) -> Loan:
    return LoanService(session).return_loan(actor, loan_id)
