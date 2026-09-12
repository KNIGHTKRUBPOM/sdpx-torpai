"""Create users, books, and loans."""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260912_01"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table("users", sa.Column("id", sa.String(36), primary_key=True), sa.Column("student_id", sa.String(30), nullable=True, unique=True), sa.Column("name", sa.String(120), nullable=False), sa.Column("email", sa.String(255), nullable=False, unique=True), sa.Column("password_hash", sa.Text(), nullable=False), sa.Column("role", sa.String(20), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_role", "users", ["role"])
    op.create_table("books", sa.Column("id", sa.String(36), primary_key=True), sa.Column("isbn", sa.String(13), nullable=False, unique=True), sa.Column("title", sa.String(255), nullable=False), sa.Column("author", sa.String(255), nullable=False), sa.Column("category", sa.String(100), nullable=False), sa.Column("status", sa.String(20), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_books_isbn", "books", ["isbn"])
    op.create_index("ix_books_title", "books", ["title"])
    op.create_index("ix_books_author", "books", ["author"])
    op.create_index("ix_books_category", "books", ["category"])
    op.create_index("ix_books_status", "books", ["status"])
    op.create_table("loans", sa.Column("id", sa.String(36), primary_key=True), sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False), sa.Column("book_id", sa.String(36), sa.ForeignKey("books.id"), nullable=False), sa.Column("borrowed_at", sa.DateTime(timezone=True), nullable=False), sa.Column("due_at", sa.DateTime(timezone=True), nullable=False), sa.Column("returned_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_loans_user_id", "loans", ["user_id"])
    op.create_index("ix_loans_book_id", "loans", ["book_id"])
    op.create_index("uq_active_loan_per_book", "loans", ["book_id"], unique=True, postgresql_where=sa.text("returned_at IS NULL"), sqlite_where=sa.text("returned_at IS NULL"))


def downgrade() -> None:
    op.drop_table("loans")
    op.drop_table("books")
    op.drop_table("users")
