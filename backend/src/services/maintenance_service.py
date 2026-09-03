from __future__ import annotations

import json
import hashlib
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.persistence.models import (
    AssignmentRecord,
    AuditRecord,
    CriterionRecord,
    MembershipRecord,
    NotificationRecord,
    PairAssignmentRecord,
    ScoreSnapshotRecord,
    SubmissionRevisionRecord,
    UserRecord,
)
from src.services.score_reporting_service import ScoreReportingService


def aware_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def finalize_scores(
    session: Session,
    assignment: AssignmentRecord,
    finalized_by: str,
    now: datetime | None = None,
) -> tuple[ScoreSnapshotRecord, bool]:
    existing = session.scalar(
        select(ScoreSnapshotRecord)
        .where(ScoreSnapshotRecord.assignment_id == assignment.id)
        .order_by(ScoreSnapshotRecord.revision.desc())
    )
    if assignment.status == "FINALIZED" and existing is not None:
        return existing, False
    service = ScoreReportingService(session, assignment)
    revisions = session.scalars(
        select(SubmissionRevisionRecord).where(SubmissionRevisionRecord.assignment_id == assignment.id)
    ).all()
    inputs = {
        "config": {
            "scoreFloor": str(assignment.score_floor),
            "scoreCeiling": str(assignment.score_ceiling),
            "completionThreshold": str(assignment.completion_threshold),
            "instructorWeight": str(assignment.instructor_weight),
            "formulaVersion": assignment.scoring_formula_version,
        },
        "submissions": [
            {
                "id": revision.id,
                "evaluatorId": revision.evaluator_id,
                "side": revision.side,
                "revision": revision.revision,
                "answers": json.loads(revision.answers_json),
            }
            for revision in revisions
        ],
    }
    outputs = {
        "group": service.item_scores("GROUP"),
        "individual": service.individual_report(),
        "coverage": service.coverage_report(),
    }
    finalized_at = now or datetime.now(timezone.utc)
    snapshot = ScoreSnapshotRecord(
        id=str(uuid4()),
        assignment_id=assignment.id,
        revision=(existing.revision + 1) if existing else 1,
        inputs_json=json.dumps(inputs, ensure_ascii=False, sort_keys=True),
        outputs_json=json.dumps(outputs, ensure_ascii=False, sort_keys=True),
        formula_version=assignment.scoring_formula_version,
        finalized_by=finalized_by,
        finalized_at=finalized_at,
    )
    session.add(snapshot)
    assignment.status = "FINALIZED"
    assignment.finalized_at = finalized_at
    return snapshot, True


def _queue_notification(
    session: Session,
    assignment: AssignmentRecord,
    user_id: str,
    notification_type: str,
    message: str,
) -> bool:
    dedupe_key = f"{notification_type}:{assignment.id}:{user_id}"
    if session.scalar(select(NotificationRecord.id).where(NotificationRecord.dedupe_key == dedupe_key)):
        return False
    session.add(
        NotificationRecord(
            id=str(uuid4()),
            dedupe_key=dedupe_key,
            user_id=user_id,
            notification_type=notification_type,
            payload_json=json.dumps(
                {"assignmentId": assignment.id, "message": message, "path": f"/assignments/{assignment.id}"},
                ensure_ascii=False,
                sort_keys=True,
            ),
        )
    )
    return True


def run_maintenance(
    session: Session,
    now: datetime | None = None,
    classroom_ids: list[str] | None = None,
) -> dict[str, int]:
    current_time = now or datetime.now(timezone.utc)
    counts = {
        "remindersQueued": 0,
        "assignmentsFinalized": 0,
        "finalizedNotificationsQueued": 0,
        "timeOnTaskPurged": 0,
        "studentIdentitiesAnonymized": 0,
    }
    statement = select(AssignmentRecord).where(AssignmentRecord.status.in_(["PUBLISHED", "CLOSED"]))
    if classroom_ids is not None:
        statement = statement.where(AssignmentRecord.classroom_id.in_(classroom_ids))
    assignments = session.scalars(statement).all()
    for assignment in assignments:
        latest_deadline = max(
            aware_utc(assignment.deadline),
            aware_utc(assignment.individual_deadline or assignment.deadline),
        )
        students = list(
            session.scalars(
                select(MembershipRecord.user_id).where(
                    MembershipRecord.classroom_id == assignment.classroom_id,
                    MembershipRecord.role == "STUDENT",
                    MembershipRecord.status == "ACTIVE",
                )
            ).all()
        )
        if latest_deadline + timedelta(days=14) <= current_time:
            before = {"status": assignment.status, "finalizedAt": None}
            snapshot, created = finalize_scores(session, assignment, assignment_owner(session, assignment), current_time)
            if created:
                counts["assignmentsFinalized"] += 1
                session.add(
                    AuditRecord(
                        id=str(uuid4()),
                        actor_user_id=snapshot.finalized_by,
                        assignment_id=assignment.id,
                        action="ASSIGNMENT_AUTO_FINALIZED",
                        resource_type="assignment",
                        resource_id=assignment.id,
                        before_json=json.dumps(before, sort_keys=True),
                        after_json=json.dumps(
                            {"status": "FINALIZED", "snapshotId": snapshot.id, "revision": snapshot.revision},
                            sort_keys=True,
                        ),
                        reason="Auto-finalized 14 days after the latest deadline per OQ-3",
                        request_id=f"maintenance-{uuid4()}",
                    )
                )
                for student_id in students:
                    if _queue_notification(
                        session,
                        assignment,
                        student_id,
                        "SCORES_FINALIZED",
                        "งานประเมินได้รับการ Finalize แล้ว กรุณาเปิด PairEval เพื่อดูผลของคุณ",
                    ):
                        counts["finalizedNotificationsQueued"] += 1
            continue
        if not (current_time <= latest_deadline <= current_time + timedelta(hours=48)):
            continue
        criteria_sides = {
            criterion.id: criterion.side
            for criterion in session.scalars(
                select(CriterionRecord).where(CriterionRecord.assignment_id == assignment.id)
            ).all()
        }
        assigned_by_student: dict[tuple[str, str], int] = {}
        for evaluator_id, criterion_id, pair_count in session.execute(
            select(
                PairAssignmentRecord.evaluator_id,
                PairAssignmentRecord.criterion_id,
                func.count(PairAssignmentRecord.id),
            )
            .where(PairAssignmentRecord.assignment_id == assignment.id)
            .group_by(PairAssignmentRecord.evaluator_id, PairAssignmentRecord.criterion_id)
        ).all():
            key = (evaluator_id, criteria_sides[criterion_id])
            assigned_by_student[key] = assigned_by_student.get(key, 0) + int(pair_count)
        revisions = session.scalars(
            select(SubmissionRevisionRecord)
            .where(SubmissionRevisionRecord.assignment_id == assignment.id)
            .order_by(SubmissionRevisionRecord.revision.desc())
        ).all()
        latest_revisions: dict[tuple[str, str], SubmissionRevisionRecord] = {}
        for revision in revisions:
            latest_revisions.setdefault((revision.evaluator_id, revision.side), revision)
        for student_id in students:
            incomplete = any(
                assigned > 0
                and (
                    (revision := latest_revisions.get((student_id, side))) is None
                    or revision.submitted_count < assigned
                )
                for (evaluator_id, side), assigned in assigned_by_student.items()
                if evaluator_id == student_id
            )
            if incomplete and _queue_notification(
                session,
                assignment,
                student_id,
                "DEADLINE_REMINDER",
                "เหลือเวลาไม่เกิน 48 ชั่วโมง กรุณาเปิด PairEval เพื่อส่งงานประเมินที่ยังไม่ครบ",
            ):
                counts["remindersQueued"] += 1
    time_cutoff = current_time - timedelta(days=365)
    old_revision_statement = select(SubmissionRevisionRecord).where(
        SubmissionRevisionRecord.submitted_at < time_cutoff
    )
    if classroom_ids is not None:
        old_revision_statement = old_revision_statement.join(
            AssignmentRecord, AssignmentRecord.id == SubmissionRevisionRecord.assignment_id
        ).where(AssignmentRecord.classroom_id.in_(classroom_ids))
    old_revisions = session.scalars(old_revision_statement).all()
    for revision in old_revisions:
        metadata = json.loads(revision.metadata_json or "{}")
        if "timeOnTaskMs" in metadata:
            metadata.pop("timeOnTaskMs")
            revision.metadata_json = json.dumps(metadata, sort_keys=True)
            counts["timeOnTaskPurged"] += 1

    identity_cutoff = current_time - timedelta(days=730)
    candidate_statement = select(SubmissionRevisionRecord.evaluator_id).group_by(
        SubmissionRevisionRecord.evaluator_id
    ).having(func.max(SubmissionRevisionRecord.submitted_at) < identity_cutoff)
    if classroom_ids is not None:
        candidate_statement = candidate_statement.join(
            AssignmentRecord, AssignmentRecord.id == SubmissionRevisionRecord.assignment_id
        ).where(AssignmentRecord.classroom_id.in_(classroom_ids))
    candidate_ids = list(session.scalars(candidate_statement).all())
    for user_id in candidate_ids:
        latest_submission = session.scalar(
            select(func.max(SubmissionRevisionRecord.submitted_at)).where(
                SubmissionRevisionRecord.evaluator_id == user_id
            )
        )
        if latest_submission is None or aware_utc(latest_submission) >= identity_cutoff:
            continue
        roles = set(
            session.scalars(
                select(MembershipRecord.role).where(MembershipRecord.user_id == user_id)
            ).all()
        )
        if roles - {"STUDENT"}:
            continue
        user = session.get(UserRecord, user_id)
        if user is None or user.email.endswith("@anonymized.invalid"):
            continue
        pseudonym = hashlib.sha256(user.id.encode("utf-8")).hexdigest()[:16]
        user.email = f"anon-{pseudonym}@anonymized.invalid"
        user.display_name = f"Anonymous {pseudonym[:8].upper()}"
        for membership in session.scalars(
            select(MembershipRecord).where(MembershipRecord.user_id == user.id)
        ).all():
            membership.student_id = None
        counts["studentIdentitiesAnonymized"] += 1
    session.commit()
    return counts


def assignment_owner(session: Session, assignment: AssignmentRecord) -> str:
    owner_id = session.scalar(
        select(MembershipRecord.user_id).where(
            MembershipRecord.classroom_id == assignment.classroom_id,
            MembershipRecord.role == "OWNER",
        )
    )
    if owner_id is None:
        raise RuntimeError(f"Assignment {assignment.id} has no classroom owner")
    return owner_id
