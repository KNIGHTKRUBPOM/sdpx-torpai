# PairEval Product Backlog

Backlog นี้ย่อ PairEval PRD v2.0 เป็น Sprint ที่ปิด feedback loop ได้จริง โดยทุก story มี acceptance criteria แบบ pass/fail และ trace ไปยัง API/unit rule ได้

## Definition of Done (ใช้กับทุก story)

- Feature ผ่าน acceptance criteria และ authorization ตาม role/classroom scope
- Business rule มี unit test หรือ integration-test slot ใน `TEST_PLAN.md`
- Critical user flow มี E2E coverage ตามระดับ workshop
- API contract validate และ implementation ไม่เพิ่ม endpoint นอก story
- Code ผ่าน review, tests, lint และ build
- Deploy ขึ้น staging ก่อนเปลี่ยนสถานะเป็น Done

## Sprint 1 — M1 Walking Skeleton

### US-01 — สร้าง Classroom

**As an** instructor owner, **I want to** create a classroom with timezone and allowed email domains, **so that** evaluation data has an explicit security scope.

**Acceptance Criteria**

- Given an authenticated instructor, when valid name/timezone/domain data is posted, then the API returns `201` with a new `DRAFT` classroom.
- Given a student role, when the same endpoint is called directly, then the API returns `403`.
- Given an unsupported timezone or empty domain list, when submitted, then the API returns a stable `422` error code.

**Trace:** `POST /api/classrooms` · `AUTHZ-01`

### US-02 — Import Roster แบบ Atomic

**As a** TA or instructor, **I want to** import student/group data from CSV atomically, **so that** a partially valid roster never corrupts pairing.

**Acceptance Criteria**

- Given 100 valid rows, when importing the CSV, then all rows are accepted and a summary is returned.
- Given row 42 has an invalid email, when importing, then no rows are saved and the error identifies row 42.
- Given a duplicate normalized email, blank group, formula-like cell, or group with fewer than two members, when importing, then the whole file is rejected with typed row errors.

**Trace:** `POST /api/classrooms/{id}/roster:import` · `CLASS-01`, `CLASS-02`

### US-03 — Configure Assignment & Criteria

**As an** instructor, **I want to** create a draft assignment with artifact, deadlines, score split and weighted criteria, **so that** students know exactly what they compare.

**Acceptance Criteria**

- Given valid assignment data, when created, then the API returns `201` and status `DRAFT`.
- Given enabled-side criteria total `99.98%`, when publish validation runs, then the API returns `422 CRITERIA_WEIGHT_INVALID`.
- Given the assignment is already published, when criteria are patched, then the API returns `409 ASSIGNMENT_NOT_DRAFT`.

**Trace:** `POST /api/assignments` · `ASSIGN-01`, `ASSIGN-02`

### US-04 — Preview Pairing Feasibility

**As an** instructor, **I want to** see feasible coverage, workload and total comparisons before publish, **so that** I can explain workload and constraints.

**Acceptance Criteria**

- Given 12 students in three groups of four and target coverage five, when previewed, then actual coverage is four and workload is one.
- Given target coverage is reduced, when results are shown, then the response includes a numeric Thai explanation rather than a generic warning.
- Given fewer than three groups, when group evaluation is previewed, then the API returns `409 PAIRING_NOT_FEASIBLE`.

**Trace:** `GET /api/assignments/{id}/feasibility` · `PAIR-06`

### US-05 — Publish & Generate Deterministic Pairs

**As an** instructor, **I want to** publish a valid draft and persist balanced pairs, **so that** evaluators never receive runtime-random or biased assignments.

**Acceptance Criteria**

- Given valid criteria and feasible roster, when publish is called, then pair assignments are stored and status becomes `PUBLISHED`.
- Given the same inputs and seed, when generated twice in isolated repositories, then assignments including left/right display are identical.
- Given generated assignments, then no evaluator sees their group and pair/evaluator duplicates do not exist.

**Trace:** `POST /api/assignments/{id}:publish` · `PAIR-01`–`PAIR-05`

### US-06 — Complete a Six-choice Evaluation

**As a** student, **I want to** compare two artifacts using one of six labelled choices, **so that** I can make a quick but meaningful judgment without a neutral shortcut.

**Acceptance Criteria**

- Given an assigned pair, when the screen opens, then both items and artifact links are visible with all six text-labelled radio options.
- Given a choice changes, when debounce completes, then a draft is saved idempotently and an `aria-live` save status is announced.
- Given the same save payload is retried, then the API returns the same current comparison rather than creating a duplicate.

**Trace:** `GET /api/assignments/{id}/my-evaluations`, `PUT /api/comparisons/{id}` · `EVAL-01`, `EVAL-03`

### US-07 — Resume, Submit & Re-submit

**As a** student, **I want to** resume drafts and submit my latest answers before the deadline, **so that** a network interruption or changed judgment does not lose work.

**Acceptance Criteria**

- Given saved drafts, when reopening the assignment, then the latest choices and progress are restored.
- Given unanswered pairs, when submit is requested, then the UI reports the missing count but still allows confirmation.
- Given three submissions before deadline, when scores are computed, then only revision three is active while all revisions remain auditable.
- Given the deadline has passed, when submitting, then the API returns `409 DEADLINE_PASSED`.

**Trace:** `POST /api/assignments/{id}/submissions` · `EVAL-02`, `EVAL-04`

### US-08 — View Transparent Interim Score

**As a** student, **I want to** see my current participation and explainable interim score, **so that** I know both earned quality and the effect of incomplete evaluation.

**Acceptance Criteria**

- Given fewer than `k_min` submitted evaluators for an individual score, when requested, then the result says “ยังมีข้อมูลไม่พอ” and exposes no evaluator identity.
- Given sufficient data, when score is requested, then group component, individual component, participation `p`, multiplier `M`, flags and interim label are returned.
- Given the PRD worked-example inputs, when calculated, then displayed complete/incomplete scores are `16.93` and `10.97`.

**Trace:** `GET /api/assignments/{id}/my-score` · `SCORE-01`–`SCORE-07`, `EVAL-05`

## AI edge-case review disposition

**Accepted:** unequal group sizes, infeasible coverage, retry/idempotency, deadline races, fractional instructor weight, formula-injection CSV, and insufficient-anonymity states are represented in stories/tests.

**Deferred:** LMS sync, offline queue conflict resolution, XLSX identity export, appeals and automated finalize belong to M2–M4 because they do not shorten the first end-to-end walking skeleton.

**Rejected for v1:** neutral choice, sum-to-one normalization, runtime pair randomization, local passwords, and exposing daily score deltas conflict directly with PRD decisions D1, D2, FR-PAIR-01, FR-AUTH-01 and FR-ANON-03.

## Sprint board snapshot

- **Done:** reusable stack/tool setup, product intent, architecture, ERD, OpenAPI contract, pairing/scoring unit-test harness, responsive evaluation prototype
- **In Progress:** connect walking-skeleton UI to FastAPI persistence flow
- **To Do:** production OIDC, PostgreSQL adapter, atomic CSV importer, immutable audit store, deployment and external-user M1 validation
