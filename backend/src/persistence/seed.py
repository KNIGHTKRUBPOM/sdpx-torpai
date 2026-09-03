from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import NAMESPACE_URL, uuid5

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.domain.models import Student
from src.persistence.models import (
    AssignmentRecord,
    ClassroomRecord,
    ComparisonRecord,
    CriterionRecord,
    GroupRecord,
    MembershipRecord,
    PairAssignmentRecord,
    SubmissionRevisionRecord,
    UserRecord,
)
from src.repositories.sqlalchemy_pair_assignment_repository import SqlAlchemyPairAssignmentRepository
from src.services.pairing_service import PairingService


DEMO_CLASSROOM_ID = "demo-classroom"
DEMO_ASSIGNMENT_ID = "demo-assignment"
DEMO_CRITERION_ID = "criterion-ux"


def stable_id(kind: str, value: str) -> str:
    return str(uuid5(NAMESPACE_URL, f"paireval:{kind}:{value}"))


def seed_demo_data(session: Session) -> None:
    if session.get(UserRecord, "instructor-demo") is None:
        session.add(
            UserRecord(
                id="instructor-demo",
                email="instructor@university.example",
                display_name="อาจารย์เดโม",
            )
        )
    for index in range(1, 13):
        user_id = f"student-{index:02d}"
        if session.get(UserRecord, user_id) is None:
            session.add(
                UserRecord(
                    id=user_id,
                    email=f"student{index:02d}@university.example",
                    display_name=f"นักศึกษา {index:02d}",
                )
            )
    session.flush()

    if session.get(ClassroomRecord, DEMO_CLASSROOM_ID) is None:
        session.add(
            ClassroomRecord(
                id=DEMO_CLASSROOM_ID,
                name="CSX 301 · Software Studio",
                slug="csx-301-demo",
                timezone="Asia/Bangkok",
                owner_user_id="instructor-demo",
            )
        )
        session.add(
            MembershipRecord(
                id=stable_id("membership", f"{DEMO_CLASSROOM_ID}:instructor-demo"),
                classroom_id=DEMO_CLASSROOM_ID,
                user_id="instructor-demo",
                role="OWNER",
            )
        )
        group_names = ("Aurora", "Borealis", "Catalyst")
        for group_index, group_name in enumerate(group_names, start=1):
            group_id = f"demo-group-{group_index}"
            session.add(
                GroupRecord(
                    id=group_id,
                    classroom_id=DEMO_CLASSROOM_ID,
                    name=group_name,
                    artifact_url=f"https://example.com/showcase/{group_name.lower()}",
                )
            )
            for student_index in range((group_index - 1) * 4 + 1, group_index * 4 + 1):
                user_id = f"student-{student_index:02d}"
                session.add(
                    MembershipRecord(
                        id=stable_id("membership", f"{DEMO_CLASSROOM_ID}:{user_id}"),
                        classroom_id=DEMO_CLASSROOM_ID,
                        user_id=user_id,
                        role="STUDENT",
                        group_id=group_id,
                        student_id=f"66{student_index:04d}",
                    )
                )
        session.flush()

    if session.get(AssignmentRecord, DEMO_ASSIGNMENT_ID) is None:
        session.add(
            AssignmentRecord(
                id=DEMO_ASSIGNMENT_ID,
                classroom_id=DEMO_CLASSROOM_ID,
                name="Sprint 1 Pairwise Review",
                description="เปรียบเทียบประสบการณ์ใช้งานของผลงานแต่ละกลุ่ม",
                status="PUBLISHED",
                group_max_score=Decimal("20"),
                individual_max_score=Decimal("0"),
                deadline=datetime.now(timezone.utc) + timedelta(days=14),
                seed=20260819,
                published_at=datetime.now(timezone.utc),
            )
        )
        session.add(
            CriterionRecord(
                id=DEMO_CRITERION_ID,
                assignment_id=DEMO_ASSIGNMENT_ID,
                name="User Experience",
                prompt="ผลงานใดออกแบบ flow และ feedback ให้ผู้ใช้ทำภารกิจหลักได้ชัดเจนกว่า?",
                weight_pct=Decimal("100"),
                side="GROUP",
            )
        )
        session.flush()

    pair_count = session.scalar(
        select(PairAssignmentRecord).where(PairAssignmentRecord.assignment_id == DEMO_ASSIGNMENT_ID).limit(1)
    )
    if pair_count is None:
        members = session.scalars(
            select(MembershipRecord).where(
                MembershipRecord.classroom_id == DEMO_CLASSROOM_ID,
                MembershipRecord.role == "STUDENT",
            )
        ).all()
        students = [Student(id=member.user_id, group_id=member.group_id or "") for member in members]
        PairingService(SqlAlchemyPairAssignmentRepository(session)).generate_group_pairs(
            DEMO_ASSIGNMENT_ID,
            DEMO_CRITERION_ID,
            students,
            seed=20260819,
        )
        session.flush()

    baseline = session.scalars(
        select(PairAssignmentRecord)
        .where(
            PairAssignmentRecord.assignment_id == DEMO_ASSIGNMENT_ID,
            (PairAssignmentRecord.item_a_id == "demo-group-3")
            | (PairAssignmentRecord.item_b_id == "demo-group-3"),
        )
        .order_by(PairAssignmentRecord.id)
        .limit(3)
    ).all()
    now = datetime.now(timezone.utc)
    for index, pair in enumerate(baseline):
        if session.get(ComparisonRecord, pair.id) is None:
            session.add(
                ComparisonRecord(
                    pair_assignment_id=pair.id,
                    evaluator_id=pair.evaluator_id,
                    choice=(2, 3, 2)[index],
                    status="SUBMITTED",
                    time_on_task_ms=45000,
                    saved_at=now,
                    submitted_at=now,
                )
            )
    session.flush()

    # Older M1 databases may have submitted comparison rows without an immutable
    # revision snapshot. Backfill once so later draft edits cannot change scores.
    submitted = session.scalars(
        select(ComparisonRecord)
        .join(PairAssignmentRecord, PairAssignmentRecord.id == ComparisonRecord.pair_assignment_id)
        .where(
            PairAssignmentRecord.assignment_id == DEMO_ASSIGNMENT_ID,
            ComparisonRecord.status == "SUBMITTED",
        )
    ).all()
    answers_by_evaluator: dict[str, dict[str, int]] = {}
    for comparison in submitted:
        answers_by_evaluator.setdefault(comparison.evaluator_id, {})[comparison.pair_assignment_id] = comparison.choice
    for evaluator_id, answers in answers_by_evaluator.items():
        existing_revision = session.scalar(
            select(SubmissionRevisionRecord).where(
                SubmissionRevisionRecord.assignment_id == DEMO_ASSIGNMENT_ID,
                SubmissionRevisionRecord.evaluator_id == evaluator_id,
                SubmissionRevisionRecord.side == "GROUP",
            )
        )
        if existing_revision is None:
            session.add(
                SubmissionRevisionRecord(
                    id=stable_id("seed-revision", f"{DEMO_ASSIGNMENT_ID}:{evaluator_id}"),
                    assignment_id=DEMO_ASSIGNMENT_ID,
                    evaluator_id=evaluator_id,
                    side="GROUP",
                    revision=1,
                    idempotency_key=f"seed:{DEMO_ASSIGNMENT_ID}:{evaluator_id}",
                    submitted_count=len(answers),
                    unanswered_count=0,
                    answers_json=json.dumps(answers, sort_keys=True),
                    submitted_at=now,
                )
            )
    session.commit()
