# PairEval — Workshop และ Product Completion Gap

## ข้อสรุป

- Workshop มีถึง `WS-08` และ `WS-08` เป็น workshop สุดท้ายของรายวิชา
- การทำ workshop ครบถึง WS-08 ไม่ได้แปลว่า requirement ของ PairEval ใน PRD ครบอัตโนมัติ
- Workshop สอน feedback loop รอบงานที่ทีมพัฒนา: deploy, spec, unit test, E2E,
  environment, integration, production และ quality loop
- ความครบของตัวผลิตภัณฑ์ต้องวัดจาก Release Plan ใน PRD: M1 ถึง M4
- สถานะปัจจุบันเป็น WS-03 walking skeleton และทำได้เพียงบางส่วนของ M1

## แต่ละ Workshop ทำให้ได้อะไร

### WS-01 — Deploy Loop

ต้องมี project context, setup ที่ทำซ้ำได้, first deploy และวัด commit-to-live latency

สถานะ: มี context และ scaffold แต่ยังไม่มี staging URL และ deploy loop จริง

### WS-02 — Spec Loop

ต้องมี intent, backlog, unit briefs, architecture, ERD, wireframes และ OpenAPI contract

สถานะ: มี artifact หลักแล้ว

### WS-03 — Unit Test Loop

ต้องมี domain unit tests, fake/factory/fixture, coverage และพิสูจน์ fidelity ด้วยการทำให้
business rule พังแล้ว test ต้องแดง

สถานะ: Pairing/Scoring core และ test harness ทำแล้ว

### WS-04 — Acceptance Loop

ต้องมี Playwright harness ครบ config, seed/cleanup, fixtures, page objects, smoke test และ
feature tests ที่ trace กลับ acceptance criteria ได้ รวมถึงรันซ้ำ 3 รอบโดยไม่ flaky

สถานะ: มี Playwright config และ smoke flow เบื้องต้น แต่ยังไม่มี page objects,
seed/cleanup fixture, report และ coverage ตามเกณฑ์ WS-04 ครบถ้วน

### WS-05 — Environment Loop

ต้องมี multi-stage non-root Dockerfile, `.dockerignore`, `compose.yaml`,
`compose.test.yaml`, ephemeral test database และคำสั่งเดียวสำหรับเปิดระบบ

สถานะ: ยังไม่มี artifact ชุดนี้

### WS-06 — Integration Loop

ต้องมี GitHub Actions CI/CD, cache, permissions, concurrency, branch protection,
production approval และหลักฐานว่า CI แดงแล้ว block merge ได้

สถานะ: ยังไม่มี artifact ชุดนี้ และส่วน branch protection/deploy ต้องทำบน GitHub จริง

### WS-07 — Production Loop

ต้องมี k6 load test พร้อม threshold, baseline, performance report, structured JSON logging,
requestId/redaction และ performance gate ใน CI

สถานะ: มี requestId ใน API แต่ยังไม่มี structured logging, k6, baseline, report และ CI gate

### WS-08 — Quality Loop

ต้องมี full code review, refactoring plan, refactor โดย test เดิมยังเขียว, แก้ security issue
อย่างน้อย 2 ข้อพร้อม test, security pre-check และ ADR

สถานะ: ยังไม่มี artifact ชุดนี้

## สถานะผลิตภัณฑ์เทียบ Release Plan ใน PRD

### M1 — Walking Skeleton

Flow ที่ PRD กำหนดคือ login → สร้าง classroom → import CSV → สร้าง assignment →
generate pairs → ประเมิน 1 criterion → เห็นคะแนน และต้อง deploy บน staging ให้คนนอกทีม
ใช้จนจบเองได้

สิ่งที่มีแล้ว:

- หน้าประเมิน student แบบ demo
- group pairing feasibility และ deterministic generation
- autosave/submit/score-preview API แบบ in-memory
- scoring core และ unit tests

สิ่งที่ยังขาด:

- Frontend เชื่อม Backend จริง
- Login และ role authorization
- Instructor UI
- Classroom CRUD และ CSV roster import
- Assignment/criteria CRUD และ publish flow
- Database persistence
- staging deployment และ E2E จาก browser ถึง database

ดังนั้นสถานะปัจจุบันยังเป็น partial M1

### M2 — Core Complete

ต้องเพิ่ม group + individual evaluation, scoring/participation ครบ, reports และ CSV export
แล้วทดลองกับห้องจริงไม่เกิน 30 คน

สิ่งที่ยังขาดหลัก ๆ:

- Individual pairing/evaluation UI และ API ครบ flow
- Deadline, draft persistence, revisions และ re-submit จริง
- Group/individual/pair coverage reports
- Instructor override/finalize และ score snapshot
- CSV export และการทดลองกับข้อมูลห้องจริง

### M3 — Trustworthy

ต้องเพิ่ม anonymity controls, quality signals, audit log, override และ appeals พร้อมผ่าน
security/privacy review

สิ่งที่ยังขาดหลัก ๆ:

- k-anonymity และ negative privacy tests
- Quality flags และ report
- Append-only audit log
- Appeals workflow
- Security/privacy review

### M4 — Production Ready

ต้องเพิ่ม notifications, XLSX export, WCAG 2.2 AA, load test ตาม NFR และรองรับห้อง
200 คนจริง

สิ่งที่ยังขาดหลัก ๆ:

- Notification jobs
- XLSX 4 sheets และ metadata
- Automated/manual accessibility verification
- k6 performance gate, observability และ operational readiness
- Production infrastructure, HTTPS, secret manager, backup/restore และ monitoring

## ความหมายของคำว่า “ทำให้จบ”

- ถ้าหมายถึงงานที่สั่งเดิม: จบที่ WS-03 และปัจจุบันทำส่วนหลักแล้ว
- ถ้าหมายถึง workshop ทั้งวิชา: ต้องทำต่อ WS-04 ถึง WS-08
- ถ้าหมายถึงระบบที่คนใช้ flow หลักได้จริง: ต้องปิด M1 ก่อน
- ถ้าหมายถึงระบบวิชาที่ใช้ประเมินและออกรายงานได้จริง: ต้องปิด M2
- ถ้าหมายถึงทุกฟังก์ชันใน PRD และ production-ready: ต้องปิด M1 ถึง M4

## ลำดับลงมือที่เหมาะสม

1. ปิด M1 ให้ใช้งานครบวงจรด้วย PostgreSQL และ frontend-backend integration
2. ทำ WS-04 E2E harness ครอบ flow M1
3. ปิด M2: individual evaluation, reports, finalize และ export
4. ทำ WS-05 Docker และ WS-06 CI/CD
5. ปิด M3: anonymity, audit, quality signals, appeals และ security
6. ทำ WS-07 performance/observability
7. ทำ WS-08 refactor/security/ADR
8. ปิด M4 และ deploy production/staging พร้อมหลักฐานตามเกณฑ์

## ข้อจำกัดที่ต้องตัดสินใจก่อน Production

PRD ยังมี open questions 8 ข้อ เช่น participation multiplier, การ auto-finalize,
นักศึกษาที่ถอนวิชา, privacy ของ time-on-task และสิทธิ์ co-teacher การทำ M1/M2 เริ่มได้โดยใช้
ค่า default ใน PRD แต่การประกาศว่า M3/M4 เสร็จต้องให้ผู้มีอำนาจยืนยันคำตอบเหล่านี้ รวมถึง
Google OIDC domain, cloud ที่อนุมัติ และนโยบายเก็บข้อมูล
