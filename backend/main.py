from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Literal
from uuid import uuid4

from fastapi import FastAPI, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from src.domain.models import (
    ComparisonStatus,
    CriterionScoreInput,
    Student,
    WeightedPoint,
)
from src.repositories.in_memory_pair_assignment_repository import (
    InMemoryPairAssignmentRepository,
)
from src.services.pairing_service import PairingNotFeasibleError, PairingService
from src.services.scoring_service import ScoringService


class ApiError(Exception):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        field: str | None = None,
    ) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        self.field = field


class PublishRequest(BaseModel):
    seed: int = 20260819


class ComparisonSave(BaseModel):
    choice: int = Field(ge=1, le=6)
    time_on_task_ms: int = Field(default=0, ge=0, alias="timeOnTaskMs")


class SubmissionRequest(BaseModel):
    side: Literal["GROUP", "INDIVIDUAL"]


class DemoComparison(BaseModel):
    pair_assignment_id: str
    evaluator_id: str
    choice: int
    status: ComparisonStatus
    saved_at: datetime
    submitted_at: datetime | None = None


app = FastAPI(
    title="PairEval API",
    version="0.3.0",
    description="WS-03 walking skeleton. Demo authentication and in-memory state are not production adapters.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"] ,
)


@app.middleware("http")
async def attach_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid4()))
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


@app.exception_handler(ApiError)
async def handle_api_error(request: Request, error: ApiError) -> JSONResponse:
    return JSONResponse(
        status_code=error.status_code,
        content={
            "error": {
                "code": error.code,
                "message": error.message,
                "field": error.field,
                "requestId": request.state.request_id,
            }
        },
    )


DEMO_ASSIGNMENT_ID = "demo-assignment"
DEMO_CRITERION_ID = "criterion-ux"
DEMO_GROUP_NAMES = {
    "group-1": "Aurora",
    "group-2": "Borealis",
    "group-3": "Catalyst",
}
DEMO_ARTIFACTS = {
    group_id: f"https://example.edu/pair-eval/{group_id}"
    for group_id in DEMO_GROUP_NAMES
}
DEMO_STUDENTS = [
    Student(id=f"student-{index:02d}", group_id=f"group-{((index - 1) // 4) + 1}")
    for index in range(1, 13)
]

pair_repository = InMemoryPairAssignmentRepository()
pairing_service = PairingService(pair_repository)
comparison_state: dict[str, DemoComparison] = {}
submission_revisions: dict[tuple[str, str], int] = {}
idempotent_submissions: dict[tuple[str, str, str], dict[str, object]] = {}


def require_demo_assignment(assignment_id: str) -> None:
    if assignment_id != DEMO_ASSIGNMENT_ID:
        raise ApiError(404, "ASSIGNMENT_NOT_FOUND", "Assignment was not found.")


def demo_student(evaluator_id: str) -> Student:
    student = next(
        (student for student in DEMO_STUDENTS if student.id == evaluator_id),
        None,
    )
    if student is None:
        raise ApiError(401, "DEMO_USER_UNKNOWN", "The demo evaluator does not exist.")
    return student


def feasibility_payload():
    try:
        result = pairing_service.solve_group_feasibility(DEMO_STUDENTS)
    except PairingNotFeasibleError as error:
        raise ApiError(409, "PAIRING_NOT_FEASIBLE", str(error)) from error
    return {
        "targetCoverage": result.target_coverage,
        "actualCoverage": result.actual_coverage,
        "workload": result.workload,
        "pairCount": result.pair_count,
        "totalComparisons": result.total_comparisons,
        "reduced": result.reduced,
        "explanation": result.explanation,
    }


@app.get("/")
def root():
    return {
        "service": "PairEval API",
        "version": app.version,
        "status": "ok",
        "mode": "demo",
    }


@app.get("/api/assignments/{assignment_id}/feasibility")
def get_feasibility(assignment_id: str):
    require_demo_assignment(assignment_id)
    return feasibility_payload()


@app.post("/api/assignments/{assignment_id}:publish", status_code=201)
def publish_assignment(assignment_id: str, request: PublishRequest):
    require_demo_assignment(assignment_id)
    try:
        feasibility, assignments = pairing_service.generate_group_pairs(
            assignment_id,
            DEMO_CRITERION_ID,
            DEMO_STUDENTS,
            seed=request.seed,
        )
    except PairingNotFeasibleError as error:
        raise ApiError(409, "PAIRING_NOT_FEASIBLE", str(error)) from error
    return {
        "assignmentId": assignment_id,
        "status": "PUBLISHED",
        "pairAssignments": len(assignments),
        "feasibility": {
            "targetCoverage": feasibility.target_coverage,
            "actualCoverage": feasibility.actual_coverage,
            "workload": feasibility.workload,
            "pairCount": feasibility.pair_count,
            "totalComparisons": feasibility.total_comparisons,
            "reduced": feasibility.reduced,
            "explanation": feasibility.explanation,
        },
    }


@app.get("/api/assignments/{assignment_id}/my-evaluations")
def get_my_evaluations(
    assignment_id: str,
    side: Literal["GROUP", "INDIVIDUAL"] = "GROUP",
    evaluator_id: str = Header(default="student-09", alias="X-Demo-User"),
):
    require_demo_assignment(assignment_id)
    demo_student(evaluator_id)
    if side == "INDIVIDUAL":
        return []
    assignments = pair_repository.list_for_criterion(
        assignment_id,
        DEMO_CRITERION_ID,
    )
    if not assignments:
        raise ApiError(
            409,
            "ASSIGNMENT_NOT_PUBLISHED",
            "Publish the demo assignment before requesting evaluations.",
        )
    result = []
    for pair in assignments:
        if pair.evaluator_id != evaluator_id:
            continue
        left_id = pair.display_left_item_id
        right_id = pair.item_b_id if left_id == pair.item_a_id else pair.item_a_id
        current = comparison_state.get(pair.id)
        result.append(
            {
                "id": pair.id,
                "criterion": "User Experience",
                "leftItem": DEMO_GROUP_NAMES[left_id],
                "rightItem": DEMO_GROUP_NAMES[right_id],
                "artifactUrls": [DEMO_ARTIFACTS[left_id], DEMO_ARTIFACTS[right_id]],
                "choice": current.choice if current else None,
                "status": current.status.value if current else "UNANSWERED",
            }
        )
    return result


@app.put("/api/comparisons/{pair_assignment_id}")
def save_comparison(
    pair_assignment_id: str,
    payload: ComparisonSave,
    evaluator_id: str = Header(default="student-09", alias="X-Demo-User"),
):
    demo_student(evaluator_id)
    assignments = pair_repository.list_for_criterion(
        DEMO_ASSIGNMENT_ID,
        DEMO_CRITERION_ID,
    )
    pair = next((item for item in assignments if item.id == pair_assignment_id), None)
    if pair is None:
        raise ApiError(404, "PAIR_ASSIGNMENT_NOT_FOUND", "Pair assignment was not found.")
    if pair.evaluator_id != evaluator_id:
        raise ApiError(403, "PAIR_ASSIGNMENT_FORBIDDEN", "This pair belongs to another evaluator.")
    now = datetime.now(timezone.utc)
    current = DemoComparison(
        pair_assignment_id=pair.id,
        evaluator_id=evaluator_id,
        choice=payload.choice,
        status=ComparisonStatus.DRAFT,
        saved_at=now,
    )
    comparison_state[pair.id] = current
    return {
        "pairAssignmentId": pair.id,
        "choice": current.choice,
        "status": current.status.value,
        "savedAt": current.saved_at.isoformat(),
    }


@app.post("/api/assignments/{assignment_id}/submissions", status_code=201)
def submit_evaluation(
    assignment_id: str,
    payload: SubmissionRequest,
    idempotency_key: str = Header(alias="Idempotency-Key", min_length=8),
    evaluator_id: str = Header(default="student-09", alias="X-Demo-User"),
):
    require_demo_assignment(assignment_id)
    demo_student(evaluator_id)
    idempotency_identity = (evaluator_id, payload.side, idempotency_key)
    if idempotency_identity in idempotent_submissions:
        return idempotent_submissions[idempotency_identity]

    assignments = [
        pair
        for pair in pair_repository.list_for_criterion(
            assignment_id,
            DEMO_CRITERION_ID,
        )
        if pair.evaluator_id == evaluator_id
    ]
    submitted_at = datetime.now(timezone.utc)
    submitted_count = 0
    for pair in assignments:
        current = comparison_state.get(pair.id)
        if current is None:
            continue
        comparison_state[pair.id] = current.model_copy(
            update={
                "status": ComparisonStatus.SUBMITTED,
                "submitted_at": submitted_at,
            }
        )
        submitted_count += 1

    revision_identity = (evaluator_id, payload.side)
    revision = submission_revisions.get(revision_identity, 0) + 1
    submission_revisions[revision_identity] = revision
    result: dict[str, object] = {
        "assignmentId": assignment_id,
        "side": payload.side,
        "revision": revision,
        "submittedCount": submitted_count,
        "unansweredCount": len(assignments) - submitted_count,
        "submittedAt": submitted_at.isoformat(),
    }
    idempotent_submissions[idempotency_identity] = result
    return result


@app.get("/api/assignments/{assignment_id}/my-score")
def get_my_score(
    assignment_id: str,
    evaluator_id: str = Header(default="student-09", alias="X-Demo-User"),
):
    require_demo_assignment(assignment_id)
    student = demo_student(evaluator_id)
    assignments = pair_repository.list_for_criterion(
        assignment_id,
        DEMO_CRITERION_ID,
    )
    submitted_points: list[WeightedPoint] = []
    for pair in assignments:
        if student.group_id not in {pair.item_a_id, pair.item_b_id}:
            continue
        current = comparison_state.get(pair.id)
        if current is None or current.status != ComparisonStatus.SUBMITTED:
            continue
        right_id = (
            pair.item_b_id
            if pair.display_left_item_id == pair.item_a_id
            else pair.item_a_id
        )
        submitted_points.append(
            WeightedPoint(
                score=ScoringService.point_for_item(
                    current.choice,
                    student.group_id,
                    pair.display_left_item_id,
                    right_id,
                ),
                evaluator_weight=Decimal("1"),
                status=current.status,
            )
        )

    own_assignments = [pair for pair in assignments if pair.evaluator_id == evaluator_id]
    own_submitted = sum(
        comparison_state.get(pair.id) is not None
        and comparison_state[pair.id].status == ComparisonStatus.SUBMITTED
        for pair in own_assignments
    )
    participation = ScoringService.participation_ratio(
        own_submitted,
        len(own_assignments),
        0,
        0,
    )
    multiplier = ScoringService.participation_multiplier(participation)

    if len(submitted_points) < 3:
        return {
            "state": "INSUFFICIENT_DATA",
            "label": "ยังมีข้อมูลไม่พอ",
            "groupComponent": None,
            "individualComponent": None,
            "participationRatio": float(participation),
            "participationMultiplier": float(multiplier),
            "total": None,
            "flags": ["LOW_CONFIDENCE"],
        }

    quality = ScoringService.quality_index(submitted_points)
    if quality is None:
        raise ApiError(409, "SCORE_NOT_READY", "No submitted comparisons are available.")
    group_component = ScoringService.criterion_score(
        CriterionScoreInput(quality_index=quality, weight_pct=Decimal("100")),
        Decimal("15"),
    )
    total = ScoringService.final_personal_score(
        group_component,
        Decimal("0"),
        participation,
    )
    return {
        "state": "INTERIM",
        "label": "ชั่วคราว — อาจเปลี่ยนแปลงได้",
        "groupComponent": float(group_component),
        "individualComponent": 0,
        "participationRatio": float(participation),
        "participationMultiplier": float(multiplier),
        "total": float(total),
        "flags": [],
    }
