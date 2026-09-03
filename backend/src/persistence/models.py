from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.persistence.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserRecord(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(160))
    status: Mapped[str] = mapped_column(String(24), default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class ClassroomRecord(Base):
    __tablename__ = "classrooms"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    timezone: Mapped[str] = mapped_column(String(80), default="Asia/Bangkok")
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class GroupRecord(Base):
    __tablename__ = "groups"
    __table_args__ = (UniqueConstraint("classroom_id", "name"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    classroom_id: Mapped[str] = mapped_column(ForeignKey("classrooms.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(160))
    artifact_url: Mapped[str | None] = mapped_column(Text, nullable=True)


class MembershipRecord(Base):
    __tablename__ = "classroom_memberships"
    __table_args__ = (UniqueConstraint("classroom_id", "user_id"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    classroom_id: Mapped[str] = mapped_column(ForeignKey("classrooms.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(24))
    group_id: Mapped[str | None] = mapped_column(ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)
    student_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    status: Mapped[str] = mapped_column(String(24), default="ACTIVE", index=True)


class AssignmentRecord(Base):
    __tablename__ = "assignments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    classroom_id: Mapped[str] = mapped_column(ForeignKey("classrooms.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(180))
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(24), default="DRAFT", index=True)
    group_max_score: Mapped[Decimal] = mapped_column(Numeric(8, 2), default=Decimal("20"))
    individual_max_score: Mapped[Decimal] = mapped_column(Numeric(8, 2), default=Decimal("0"))
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    individual_deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    target_coverage: Mapped[int] = mapped_column(Integer, default=5)
    max_workload: Mapped[int] = mapped_column(Integer, default=8)
    min_comparisons: Mapped[int] = mapped_column(Integer, default=3)
    score_floor: Mapped[Decimal] = mapped_column(Numeric(4, 3), default=Decimal("0.600"))
    score_ceiling: Mapped[Decimal] = mapped_column(Numeric(4, 3), default=Decimal("1.000"))
    completion_threshold: Mapped[Decimal] = mapped_column(Numeric(4, 3), default=Decimal("0.900"))
    instructor_weight: Mapped[Decimal] = mapped_column(Numeric(6, 3), default=Decimal("1.000"))
    scoring_formula_version: Mapped[str] = mapped_column(String(32), default="v2.0")
    seed: Mapped[int] = mapped_column(Integer, default=20260819)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finalized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class CriterionRecord(Base):
    __tablename__ = "criteria"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    assignment_id: Mapped[str] = mapped_column(ForeignKey("assignments.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(160))
    prompt: Mapped[str] = mapped_column(Text)
    weight_pct: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=Decimal("100"))
    side: Mapped[str] = mapped_column(String(24), default="GROUP")


class PairAssignmentRecord(Base):
    __tablename__ = "pair_assignments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    assignment_id: Mapped[str] = mapped_column(ForeignKey("assignments.id", ondelete="CASCADE"), index=True)
    criterion_id: Mapped[str] = mapped_column(ForeignKey("criteria.id", ondelete="CASCADE"), index=True)
    evaluator_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    # Item IDs point to groups for GROUP criteria and users for INDIVIDUAL criteria.
    # Authorization always resolves them through the criterion side and classroom scope.
    item_a_id: Mapped[str] = mapped_column(String(64))
    item_b_id: Mapped[str] = mapped_column(String(64))
    display_left_item_id: Mapped[str] = mapped_column(String(64))
    generation: Mapped[int] = mapped_column(Integer, default=1)


class ComparisonRecord(Base):
    __tablename__ = "comparisons"

    pair_assignment_id: Mapped[str] = mapped_column(ForeignKey("pair_assignments.id", ondelete="CASCADE"), primary_key=True)
    evaluator_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    choice: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(24), default="DRAFT")
    time_on_task_ms: Mapped[int] = mapped_column(Integer, default=0)
    saved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SubmissionRevisionRecord(Base):
    __tablename__ = "submission_revisions"
    __table_args__ = (UniqueConstraint("assignment_id", "evaluator_id", "side", "revision"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    assignment_id: Mapped[str] = mapped_column(ForeignKey("assignments.id", ondelete="CASCADE"), index=True)
    evaluator_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    side: Mapped[str] = mapped_column(String(24))
    revision: Mapped[int] = mapped_column(Integer)
    idempotency_key: Mapped[str] = mapped_column(String(160), unique=True)
    submitted_count: Mapped[int] = mapped_column(Integer)
    unanswered_count: Mapped[int] = mapped_column(Integer)
    answers_json: Mapped[str] = mapped_column(Text)
    metadata_json: Mapped[str] = mapped_column(Text, default="{}")
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class AuditRecord(Base):
    __tablename__ = "audit_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    actor_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    assignment_id: Mapped[str | None] = mapped_column(
        ForeignKey("assignments.id", ondelete="CASCADE"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(String(80))
    resource_type: Mapped[str] = mapped_column(String(80))
    resource_id: Mapped[str] = mapped_column(String(64), index=True)
    details_json: Mapped[str] = mapped_column(Text, default="{}")
    before_json: Mapped[str] = mapped_column(Text, default="{}")
    after_json: Mapped[str] = mapped_column(Text, default="{}")
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(80), nullable=True)
    request_id: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class ApplicationStateRecord(Base):
    __tablename__ = "application_state"

    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    value: Mapped[str] = mapped_column(Text)
    protected: Mapped[bool] = mapped_column(Boolean, default=False)


class ComparisonExclusionRecord(Base):
    __tablename__ = "comparison_exclusions"

    pair_assignment_id: Mapped[str] = mapped_column(
        ForeignKey("pair_assignments.id", ondelete="CASCADE"), primary_key=True
    )
    assignment_id: Mapped[str] = mapped_column(ForeignKey("assignments.id", ondelete="CASCADE"), index=True)
    excluded_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    reason: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class ScoreOverrideRecord(Base):
    __tablename__ = "score_overrides"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    assignment_id: Mapped[str] = mapped_column(ForeignKey("assignments.id", ondelete="CASCADE"), index=True)
    side: Mapped[str] = mapped_column(String(24))
    item_id: Mapped[str] = mapped_column(String(64), index=True)
    original_value: Mapped[Decimal | None] = mapped_column(Numeric(8, 3), nullable=True)
    override_value: Mapped[Decimal] = mapped_column(Numeric(8, 3))
    reason: Mapped[str] = mapped_column(Text)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class ScoreSnapshotRecord(Base):
    __tablename__ = "score_snapshots"
    __table_args__ = (UniqueConstraint("assignment_id", "revision"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    assignment_id: Mapped[str] = mapped_column(ForeignKey("assignments.id", ondelete="CASCADE"), index=True)
    revision: Mapped[int] = mapped_column(Integer, default=1)
    inputs_json: Mapped[str] = mapped_column(Text)
    outputs_json: Mapped[str] = mapped_column(Text)
    formula_version: Mapped[str] = mapped_column(String(32))
    finalized_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    finalized_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class AppealRecord(Base):
    __tablename__ = "appeals"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    assignment_id: Mapped[str] = mapped_column(ForeignKey("assignments.id", ondelete="CASCADE"), index=True)
    student_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(24), default="OPEN")
    resolution: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class NotificationRecord(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    dedupe_key: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    notification_type: Mapped[str] = mapped_column(String(64))
    payload_json: Mapped[str] = mapped_column(Text)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class PrivacyAcknowledgementRecord(Base):
    __tablename__ = "privacy_acknowledgements"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    notice_version: Mapped[str] = mapped_column(String(32), default="v1.0")
    acknowledged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
