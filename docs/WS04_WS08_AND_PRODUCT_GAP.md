# PairEval — Workshop และ Product Completion Gap

อัปเดตล่าสุด 3 September 2026

## ข้อสรุป

- Workshop มีถึง `WS-08`; การผ่าน workshop วัด feedback loop ของทีม ส่วนความครบของผลิตภัณฑ์วัดจาก M1–M4 ใน PRD
- สถานะโค้ดปัจจุบันคือ **Local M4 implemented and tested**
- ยังไม่ถือว่า Production Ready จนกว่าจะผ่าน external gates: staging/pilot, production OIDC/HTTPS,
  manual accessibility, security/privacy sign-off,
  monitoring alert และ backup/restore drill

## สถานะ Workshop

### WS-01 — Deploy Loop

มี project context, setup ที่ทำซ้ำได้, Docker scaffold และ health endpoint แล้ว

ยังขาด staging URL, external walkthrough และหลักฐาน commit-to-live latency บน hosting จริง

### WS-02 — Spec Loop

มี intent, backlog, unit briefs, architecture, ERD, wireframes, OpenAPI contract และ traceability แล้ว

### WS-03 — Unit Test Loop

มี Pairing/Scoring domain tests, fake/factory/fixture, coverage gate และ fidelity mutation check แล้ว

### WS-04 — Acceptance Loop

มี Playwright browser flows 4 กรณี ครอบ Instructor, Student Group/Individual, persistence,
notification และ automated WCAG A/AA scan โดยปิด parallelism ที่ชน seeded account

ยังขาดหลักฐาน rerun 3 รอบบน staging และ manual external-user walkthrough

### WS-05 — Environment Loop

มี multi-stage non-root Dockerfiles, `.dockerignore`, `compose.yaml`, `compose.test.yaml`,
health checks, named volume, maintenance worker และ ephemeral PostgreSQL test service แล้ว

ยืนยัน full stack จริงแล้ว: PostgreSQL 17/backend/frontend healthy และ maintenance worker running;
backend integration suite บน ephemeral PostgreSQL ผ่าน 47 tests

### WS-06 — Integration Loop

มี GitHub Actions สำหรับ backend coverage ≥85%, frontend test/lint/build, Playwright/WCAG
และ scheduled/manual Docker+k6 job พร้อม permissions เริ่มต้นแบบ read-only

ยังต้องเปิด repository settings จริงเพื่อทดสอบ branch protection, required checks,
environment approval และพิสูจน์ว่า failing CI block merge ได้

### WS-07 — Production Loop

มี structured JSON request log พร้อม requestId/duration, redaction by design, k6 workload
200 concurrent users, NFR thresholds, CI performance gate และ operations runbook แล้ว

baseline 200 VU ผ่าน NFR-PERF-01..05 แล้ว; ยังขาด production monitoring integration และ alert drill

### WS-08 — Quality Loop

ทำ Bugbot review และแก้ประเด็นสำคัญแล้ว: autosave race, submit-before-save,
immutable revision, idempotent retry หลัง deadline, timezone และ stable validation envelope
รวมถึงเพิ่ม negative authorization/privacy tests, spreadsheet injection defense,
security headers และ append-only audit enforcement

ยังต้องทำ security/privacy sign-off โดยผู้รับผิดชอบและบันทึก ADR/approval ในระบบทีมจริง

## สถานะผลิตภัณฑ์เทียบ Release Plan

### M1 — Walking Skeleton

Local flow ครบ: login → classroom → atomic roster CSV → assignment → feasibility/publish →
persistent pairs → autosave/submit → privacy-safe score ผ่าน React, FastAPI และฐานข้อมูล

Definition of Done ที่ยังขาด: external staging URL และคนนอกทีมใช้ flow จนจบเอง

### M2 — Core Complete

Local feature ครบ: Group + Individual evaluation, separate deadline, balanced workload,
immutable submissions, combined scoring/participation, instructor reports, CSV export
และ integration fixture 15 คน/3 กลุ่ม

Definition of Done ที่ยังขาด: pilot ห้องจริงไม่เกิน 30 คนบน staging

### M3 — Trustworthy

Local feature ครบ: privacy notice/acknowledgement, k-anonymity, data-subject export,
QS-01..07, exclusion/override พร้อมเหตุผล, appeals, immutable final snapshot,
reopen revision, role-aware audit identity และ DB-enforced append-only audit

Gate ที่ยังขาด: production security/privacy review และ production OIDC/domain policy

### M4 — Production Ready

Local feature ครบ: XLSX 4 sheets + metadata, notifications, reminder/auto-finalize/retention worker,
automated WCAG scan, k6 scenario, CI gate, security headers และ operations runbook

Gate ที่ยังขาด: manual screen-reader review, approved HTTPS infrastructure, secret manager, monitoring alerts
และ backup restore drill

## ค่า PRD ที่ยืนยันแล้ว

ใช้ค่า default ตาม `project-ideas/pairwise_evaluation_prd.md`:

- score floor/ceiling = `0.60/1.00`
- completion threshold = `0.90`
- minimum comparisons = `3`
- instructor weight = `1.00`
- auto-finalize = 14 วันหลัง deadline
- co-teacher เห็น evaluator แบบ pseudonym; Owner เท่านั้นที่ export identity ได้หลังยืนยันชัดเจน
- retention = time-on-task 1 ปี และ identity/evaluation linkage 2 academic years

## ลำดับปิด External Gates

1. Deploy staging ด้วย Google OIDC/allowed domain/HTTPS จากบัญชีและ cloud ที่อนุมัติ
2. ทำ external M1 walkthrough และ M2 pilot ≤30 คน
3. เปิด GitHub required checks/environment approval แล้วพิสูจน์ CI block merge
4. ทำ manual screen-reader, security/privacy sign-off, alert drill และ backup restore drill
