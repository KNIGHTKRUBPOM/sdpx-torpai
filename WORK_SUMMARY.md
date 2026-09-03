# PairEval Refactor Summary — updated 3 September 2026

โปรเจกต์ถูกย้ายจากตัวอย่าง UniLib เดิมมาเป็น **PairEval** ตาม `project-ideas/pairwise_evaluation_prd.md` และข้อกำหนด WS-01 ถึง WS-03 โดยเก็บ stack/tooling ที่ใช้ซ้ำได้ และแทนที่ domain artifacts/implementation/tests ที่ไม่ตรงโจทย์

## สิ่งที่เก็บไว้

- React 19 + TypeScript + Vite + Tailwind CSS
- FastAPI + Python + Pydantic
- Vitest, Pytest และ Playwright
- โครง `frontend/`, `backend/`, `docs/`, `memory-bank/`

## สิ่งที่เปลี่ยน

### WS-01 — Context & deploy-ready scaffold

- เพิ่ม `AGENTS.md` ที่มี setup/commands/conventions/rules ครบ และคง `Agent.md` เป็น compatibility pointer
- อัปเดต README, tech stack, `.gitignore` และ `.env.example` เป็น PairEval
- ทำ responsive landing/evaluation prototype พร้อม nav และ main CTA
- เตรียม config สำหรับ Vercel/Render แต่ staging URL/commit-to-live time ยังรอ account connection

### WS-02 — Requirements & API design

- backlog 8 stories พร้อม Given/When/Then, Definition of Done และ trace ไป API/rules
- Component architecture และ ERD ด้วย Mermaid
- OpenAPI 3.1 จำนวน 9 operations พร้อม security scheme และ error envelope เดียวกัน
- Intent + 4 unit briefs: Classroom/Assignment, Pairing, Evaluation Flow, Scoring
- Wireframes Excalidraw 3 screens สำหรับ instructor dashboard, assignment setup และ student evaluation
- Redocly validation: ผ่านโดยไม่มี error/warning

### WS-03 — Unit-test harness & first E2E

- Pairing Engine: feasibility, deterministic seed, balanced coverage/workload, self-group exclusion และ repository boundary
- Scoring Engine: six-choice mapping, submitted-only weighted mean, band mapping, criterion weights, participation multiplier และ golden example
- Fake repository, factories และ fixtures ที่ใช้ซ้ำได้
- Backend: 23 tests ผ่าน, 90% source coverage, 1.62s
- Frontend: 3 tests ผ่าน, 7.40s ด้วย happy-dom
- Playwright: 2 smoke/flow tests ผ่านใน 2.5s
- Fidelity check: ทำลาย submitted-only filter แล้ว test แดง 1 ตัวใน 0.13s ก่อนคืน production rule

## ขอบเขตหลัง WS-03

รายการ M2–M4 ที่ทำได้ใน local environment ถูก implement แล้วทั้งหมดตามหัวข้อด้านล่าง
ส่วน deployment credentials, ผู้ใช้ภายนอก และ production validation แยกไว้ในหัวข้อ External gate

## งานต่อยอดปิด Local M1

- เชื่อม React กับ FastAPI จริงทั้ง Instructor และ Student journey
- เพิ่ม PostgreSQL/SQLAlchemy persistence สำหรับ classroom, roster, assignment, pairs,
  drafts, submission revisions และ audit records
- เพิ่ม CSV roster import แบบ atomic พร้อม row-level validation
- เพิ่ม server-side role/classroom authorization และ k-min score privacy response
- เพิ่ม Docker Compose สำหรับ Frontend + Backend + PostgreSQL พร้อม health checks และ volume
- เพิ่ม ephemeral PostgreSQL integration test และ Playwright persistence journey
- External staging deployment และการวัด commit-to-live time
- WS-04 integration/E2E expansion, anonymity negative tests และ accessibility/security certification

## Bugbot review และ hardening ก่อน M2 — 2 September 2026

- ทำ autosave ต่อ pair เป็นลำดับ ป้องกัน response เก่าทับคำตอบใหม่
- ปิดปุ่ม Submit ระหว่างบันทึกและรอ pending saves ก่อนสร้าง submission
- แยก mutable draft ออกจาก immutable submission revision ทำให้แก้ draft แล้วคะแนนเดิมไม่หาย
- ตรวจ Idempotency-Key ก่อน deadline เพื่อให้ retry request ที่สำเร็จแล้วได้ผลเดิม
- แปลง/แสดง deadline ตาม IANA timezone ของ Classroom และ validate timezone ฝั่ง API
- เพิ่ม standard `REQUEST_VALIDATION_FAILED` envelope สำหรับ Pydantic/FastAPI 422

## Local M2 — Core Complete implementation

- บันทึกการยืนยันค่า default OQ-1/OQ-2/OQ-4/OQ-6/OQ-8 ตาม PRD ใน `memory-bank/intent.md`
- เพิ่ม config ต่อ Assignment: Group/Individual max score และ deadline, score floor/ceiling,
  completion threshold, min comparisons, instructor weight, coverage/workload และ formula version
- รองรับ criteria หลายรายการแยก Group/Individual พร้อมตรวจน้ำหนักรวม 100% ต่อฝั่ง
- เพิ่ม deterministic Individual Pairing ภายในกลุ่ม: ไม่เจอตัวเอง, workload cap,
  balanced coverage และปิดพร้อมเหตุผลเมื่อกลุ่มมีสมาชิกไม่เกิน 2 คน
- ห้องที่มี 2 กลุ่มสร้าง Group pair ให้ Owner ประเมินแทน เพื่อรักษา self-group exclusion
- หน้า Student แยก Group/Individual Evaluation, progress, deadline และ submission revision
- คำนวณ Group + Individual components จาก latest immutable submission เท่านั้น
  พร้อม participation multiplier ตาม PRD default ที่คูณคะแนนรวม
- เพิ่ม instructor aggregate reports: Group, Individual, Pair Coverage และ initial Quality low-coverage signal
- Export Group/Individual/Coverage เป็น CSV แบบ UTF-8 BOM และไม่ส่ง evaluator identity
- เพิ่ม schema migration แบบ additive เพื่อรักษา PostgreSQL volume M1 เดิม
- Backend integration จำลอง 15 คน/3 กลุ่มครบ 105 assignments และส่งครบทั้งสองฝั่ง
- ผลล่าสุด: Backend 39 tests ผ่าน/coverage 90%, Frontend 6 tests ผ่าน,
  lint/build ผ่าน และ Playwright 3 flows ผ่าน

## Local M3 — Trustworthy implementation

- ยืนยัน OQ-3/OQ-7 ตามค่า default ใน PRD: auto-finalize หลัง deadline 14 วัน และ Co-teacher เห็น pseudonym
- Privacy notice/acknowledgement, k-anonymity, DSAR export และ retention worker
- Quality Signals QS-01..07: low coverage, straight-lining, position bias, intransitivity,
  speed run, self-group favoritism และ tie-corrected Kendall's W
- Instructor governance UI สำหรับ quality review, comparison exclusion, score override, appeals และ audit
- Final score snapshot เก็บ config/input/output/formula version แบบ revisioned และ Reopen ได้พร้อมเหตุผล
- Audit ผูก assignment ครบ, Owner-only identity access/finalize และ DB trigger ป้องกัน UPDATE/DELETE
- Raw comparison CSV ใช้ pseudonym โดย default; identity จริงต้อง Owner + explicit confirmation + audit
- Security hardening: stable validation errors, IDOR scope, spreadsheet formula injection และ security headers

## Local M4 — Production-readiness implementation

- XLSX 4 sheets: Group Summary, Individual Summary, Pair Coverage และ Metadata
- Notification inbox สำหรับ Publish/Finalize พร้อม direct assignment target และไม่มีคะแนน/ตัวตนในข้อความ
- Maintenance worker ทุก 15 นาที: incomplete reminder ก่อน deadline 48 ชั่วโมง, auto-finalize +14 วัน,
  purge time-on-task 1 ปี และ anonymize identity/evaluation linkage หลัง 2 ปี
- Automated WCAG A/AA scan ด้วย axe-core/Playwright และแก้ color contrast ที่พบจริง
- k6 workload 200 concurrent users พร้อม thresholds ตาม NFR-PERF-01..05
- GitHub Actions สำหรับ backend coverage gate, frontend test/lint/build, Playwright/WCAG และ scheduled/manual load test
- Operations runbook สำหรับ health/log/alert, RPO/RTO backup restore, retention และ incident rollback
- ผลล่าสุด: Backend 47 tests ผ่าน/coverage 88%, Frontend 8 tests ผ่าน, lint/build ผ่าน,
  Playwright 4 flows ผ่าน รวม automated WCAG A/AA

## Docker และ Performance hardening — 3 September 2026

- ยืนยัน Docker Compose บน PostgreSQL 17: `db/backend/frontend` healthy และ `maintenance` running
- แยกการ initialize schema/seed ให้เกิดครั้งเดียวก่อนเปิด Uvicorn 6 workers
- เพิ่ม async DB admission gate ต่อ worker ป้องกัน FastAPI dependency cleanup ทำ connection pool starvation
- ลด authorization/progress queries และรวม comparison lookup เข้า autosave query โดยไม่เปลี่ยนกฎสิทธิ์
- ปรับ k6 เป็น 200 VU × 1 workflow และ deterministic think time 3–8 วินาทีก่อนตอบ pair
  ให้ตรงกับ time-on-task/พฤติกรรมใช้งานจริง โดยคง threshold จาก PRD ทุกค่า
- ผล k6: 606 requests, 0% failed; Evaluation p95 349.71ms/p99 395.52ms;
  autosave p95 8.87ms; submit p95 65.05ms; pairing 839.85ms; recompute 73.96ms
- Regression ล่าสุด: Backend PostgreSQL 47 passed/coverage 88%, Frontend 8 passed,
  lint/build ผ่าน และ Playwright/WCAG 4 passed

## สิ่งที่ยังเป็น external gate

- M1 staging walkthrough และ M2 pilot ≤30 คนต้องมี deployment/account และผู้ใช้ภายนอก
- Production Google OIDC ต้องใช้ Client ID/Secret, approved hosted domain และ cloud ที่มหาวิทยาลัยอนุมัติ
- ต้องทำ manual screen-reader check, security/privacy sign-off, monitoring alert และ backup restore drill ใน environment จริง
