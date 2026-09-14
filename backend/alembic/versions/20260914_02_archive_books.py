"""Add soft deletion for catalog books."""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260914_02"
down_revision: str | None = "20260912_01"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("books", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_books_deleted_at", "books", ["deleted_at"])


def downgrade() -> None:
    op.drop_index("ix_books_deleted_at", table_name="books")
    op.drop_column("books", "deleted_at")
