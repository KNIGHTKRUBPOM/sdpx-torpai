# AI Code Review — WS-08 Preparation

## Target Function
- File: `backend/src/services/loan_service.py`
- Methods: `LoanService.borrow` and `LoanService.return_loan`

```python
class LoanService:
    def __init__(self, session: Session, clock: Callable[[], datetime] | None = None) -> None:
        self.session = session
        self.clock = clock or (lambda: datetime.now(timezone.utc))

    def borrow(self, user: User, isbn: str) -> Loan:
        book = self.session.scalar(
            select(Book).where(Book.isbn == isbn, Book.deleted_at.is_(None)).with_for_update()
        )
        if book is None:
            raise not_found("BOOK_NOT_FOUND", "ไม่พบหนังสือจาก ISBN นี้")
        if book.status != "available":
            raise conflict("BOOK_ALREADY_BORROWED", "หนังสือถูกยืมอยู่แล้ว")
        active_count = self.session.scalar(
            select(func.count(Loan.id)).where(Loan.user_id == user.id, Loan.returned_at.is_(None))
        )
        if (active_count or 0) >= 5:
            raise conflict("LOAN_LIMIT_REACHED", "ยืมหนังสือได้สูงสุด 5 เล่ม")

        borrowed_at = self.clock()
        loan = Loan(user=user, book=book, borrowed_at=borrowed_at, due_at=borrowed_at + timedelta(days=14))
        book.status = "borrowed"
        self.session.add(loan)
        self.session.commit()
        return self.get_by_id(loan.id)

    def return_loan(self, actor: User, loan_id: str) -> Loan:
        loan = self.get_by_id(loan_id)
        if actor.role != "librarian" and loan.user_id != actor.id:
            raise forbidden("LOAN_NOT_OWNED", "ไม่สามารถคืนหนังสือของผู้ใช้อื่นได้")
        if loan.returned_at is not None:
            raise conflict("LOAN_ALREADY_RETURNED", "รายการนี้ถูกคืนแล้ว")
        loan.returned_at = self.clock()
        loan.book.status = "available"
        self.session.commit()
        return self.get_by_id(loan.id)
```

---

## Identified Issues & Ratings

### 1. N+1 & Redundant Re-query after Commit
- **Severity:** Medium
- **Category:** Performance / Code Smell
- **Problem:** `borrow()` and `return_loan()` call `self.get_by_id(loan.id)` immediately after `self.session.commit()`. Calling `commit()` expires the ORM objects, triggering another round-trip `SELECT` with multiple `JOIN`s (`joinedload(Loan.book)`, `joinedload(Loan.user)`).
- **Why it matters:** Under load, each borrow and return transaction executes 4 separate DB roundtrips instead of 2.

### 2. Lack of Transaction Rollback on Failure
- **Severity:** High
- **Category:** Missing Error Handling / Data Integrity
- **Problem:** If an unexpected exception happens during `commit()`, the session remains in a dirty/failed transaction state without an explicit `rollback()`.
- **Why it matters:** In a pooled connection environment, subsequent requests reusing the session or connection may receive unexpected `InFailedSqlTransaction` errors.

### 3. Hardcoded Business Rule Constants
- **Severity:** Low
- **Category:** Code Smell / Maintainability
- **Problem:** Loan limit (`5`) and loan duration (`timedelta(days=14)`) are hardcoded magic numbers inside the method body.
- **Why it matters:** Business rules change often (e.g., student quota vs faculty quota or exam-period borrowing). Magic numbers make unit testing parameter combinations harder and scatter policy logic across code.

### 4. Race Condition in Return Loan
- **Severity:** Medium
- **Category:** Concurrency / Concurrency Control
- **Problem:** While `borrow()` correctly uses `.with_for_update()`, `return_loan()` queries the loan via `get_by_id(loan_id)` without row locking. Concurrent return requests on the same loan could race before `returned_at` is checked.
- **Why it matters:** Could cause duplicate return events, miscalculated loan history, or race with a simultaneous borrow.

### 5. Inconsistent Return Type and Auditability
- **Severity:** Low
- **Category:** Naming / Architecture
- **Problem:** The actor initiating the return is not saved on the `Loan` record (only `returned_at` timestamp). There is no audit column for `returned_by_user_id`.
- **Why it matters:** Librarians returning on behalf of a student cannot be tracked in audit logs or disputed returns.

---

> **Plan for WS-08:** Refactor `LoanService` to encapsulate domain policies (configurable loan limit, duration), add row-level locking for returns, eliminate redundant queries, and document decisions in an ADR.
