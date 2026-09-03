# PairEval Test Plan

แผนนี้ trace จาก `memory-bank/units/*/unit-brief.md` และ PairEval PRD v2.0 ทุก test ต้องตอบได้ว่าลบ business rule บรรทัดใดแล้ว test จะแดง

## Unit tests ที่ทำใน WS-03

### PairingService

- `PAIR-01` evaluator ไม่ได้รับ pair ที่มีกลุ่มตัวเอง
- `PAIR-02` evaluator/pair ไม่ซ้ำใน criterion/generation เดียวกัน
- `PAIR-03` coverage ของทุก pair ต่างกันไม่เกิน 1
- `PAIR-04` workload ต่อ evaluator ต่างกันไม่เกิน 1
- `PAIR-05` seed + input เดิมให้ assignments และ display side เดิม
- `PAIR-06` ห้อง 12 คน/3 กลุ่มลด coverage 5 → 4, workload 1 พร้อมเหตุผลที่มีตัวเลข
- `PAIR-07` individual evaluation: `m≤2` ปิด, `m=3` low confidence, `m=5` coverage 3, `m=8` ถูก workload cap
- Repository contract: generated assignments ถูก replace/list ผ่าน interface เดียวกับ production adapter

### ScoringService

- `SCORE-01` ใช้เฉพาะ comparison สถานะ `SUBMITTED`; draft ไม่มีผลต่อ `q`
- `SCORE-02` choice 1–6 map เป็นคะแนนฝั่งซ้าย/ขวาที่รวมกัน 1.0 และไม่มีค่ากลาง
- `SCORE-03` quality index เป็น weighted mean และรองรับ instructor weight ทศนิยม
- `SCORE-04` band mapping: `q=0 → 0.60`, `q=0.5 → 0.80`, `q=1 → 1.00`
- `SCORE-05` criterion weights ต้องรวม 100% ± 0.01
- `SCORE-06` participation ratio/multiplier แยกจาก shared group component
- `SCORE-07` golden test จาก PRD §9.5: complete `16.93`, incomplete `10.97`

### API walking skeleton

- Health response ระบุ PairEval/version/mode และทุก response มี `X-Request-ID`
- Feasibility endpoint คืน camel-case contract และ reduced coverage
- Unknown assignment คืน standard error envelope พร้อม stable code/requestId

## Frontend component tests

- App แสดง PairEval heading, navigation และ main evaluation CTA
- Evaluation card แสดง radio choice ครบ 6 ตัวพร้อม accessible labels
- เลือกคำตอบแล้ว progress และ save status เปลี่ยน
- Submit แสดง privacy-safe interim result โดยไม่มี evaluator identity

## E2E smoke test

- Homepage โหลดด้วย title `PairEval` และ main navigation มองเห็นได้
- กด CTA เข้า evaluation, เลือก forced choice, progress เปลี่ยน และ submit ได้
- M2 สร้างห้อง 15 คนผ่าน API fixture, generate individual pairs, เปิดหน้า Individual,
  autosave, reload, restore และ submit แยกฝั่งผ่าน browser
- Instructor เปิด governance panel, ดู quality/audit/appeals และควบคุม finalize/reopen ได้ตาม role
- Student เปิด notification inbox และเข้า evaluation/score จาก notification target ได้
- ทุกหน้าใน browser flow ผ่าน automated axe scan ระดับ WCAG A/AA

## M2 integration และ regression

- Individual generation ขนาดกลุ่ม 3/4/5/8 deterministic, ไม่เจอตัวเอง,
  workload ตรง feasibility และ coverage ต่างกันไม่เกิน 1
- กลุ่มขนาด 2 ปิด Individual Evaluation พร้อมเหตุผล
- ห้อง 2 กลุ่มไม่แจก pair ที่ละเมิด self-group exclusion และสร้างคู่ให้ผู้สอนแทน
- Assignment 15 คน/3 กลุ่มสร้าง Group + Individual assignments รวม 105 รายการ
- นักศึกษา 15 คน submit ครบทั้งสองฝั่งแล้ว Group/Individual component และ participation คำนวณได้
- Instructor report ทุกชุดตรวจ role authorization; Student เรียกตรงได้ 403
- CSV มี UTF-8 BOM, Content-Disposition และไม่มี evaluator identity
- Draft หลัง submission ไม่เปลี่ยนคะแนนจนกว่าจะ re-submit revision ใหม่
- Retry Idempotency-Key เดิมหลัง deadline คืน submission เดิม
- Autosave หน้าจอถูก serialize และ Submit disabled จน save ครบ

## M3/M4 integration และ security regression

- QS-01..07 ครอบ low coverage, straight-lining, position bias, speed run, intransitivity,
  self-group favoritism และ tie-corrected Kendall's W โดยไม่ลดน้ำหนักอัตโนมัติ
- Exclusion/override ต้องมีเหตุผลและสร้าง assignment-scoped audit event
- Finalize สร้าง immutable score snapshot; Reopen สร้าง revision ใหม่และ Owner เท่านั้นที่ทำได้
- Appeals เปิดหลัง Finalize 7 วันและ instructor resolve/reject พร้อมเหตุผลได้
- Co-teacher เห็น audit actor เป็น pseudonym; Owner identity access ถูก audit
- Audit table ปฏิเสธ UPDATE/DELETE ที่ระดับ SQLite/PostgreSQL trigger
- Raw CSV เป็น pseudonymous โดย default; identity export ต้อง Owner + `EXPORT_IDENTITIES`
- CSV/XLSX ป้องกัน spreadsheet formula injection และ XLSX มี 4 sheets + metadata
- Notification มี dedupe key และไม่มีคะแนน/identity ใน payload
- Maintenance reminder, auto-finalize และ retention/anonymization ทดสอบแบบ deterministic
- Security headers, stable 422 envelope, IDOR/cross-role access และ privacy acknowledgement มี regression test

## Fidelity Check (WS-03)

- Target rule: `SCORE-01` — ใช้เฉพาะ comparison สถานะ `SUBMITTED`
- Mutation: ลบตัวกรอง `point.status == ComparisonStatus.SUBMITTED` ชั่วคราวใน `ScoringService.quality_index`
- Test ที่แดง: `test_quality_index_uses_submitted_comparisons_and_fractional_weights_only`
- ผลจริง: **1 failed in 0.13s**; ค่า `q` ผิดจาก `0.666…` เป็น `0.00985…` เพราะ draft น้ำหนัก 100 หลุดเข้าคำนวณ
- Restore: คืน production rule แล้วและรัน full suite ผ่านอีกครั้ง ✅

## กฎ/หลักฐานที่ยังต้องใช้ environment ภายนอก

- Google OIDC, hosted-domain restriction, secret manager และ HTTPS deployment
- CI performance result บน GitHub-hosted runner จริง
- external-user staging walkthrough, classroom pilot ≤30 คน และ manual screen-reader review
- GitHub branch protection/production approval, monitoring alert และ backup restore drill

## Performance budget

- Backend unit suite: `< 10 s`
- Frontend unit suite: `< 10 s`
- Pair generation target: `≤ 10 s` สำหรับ 200 students × 5 criteria
- Evaluation load p95 `< 2 s`, p99 `< 4 s`; autosave p95 `< 300 ms`; submit p95 `< 800 ms`
- Score recomputation `≤ 30 s`; error rate `< 1%`

## ผลรอบล่าสุด (3 September 2026)

- Backend บน ephemeral PostgreSQL: 47 passed, source coverage 88%, 4.82s
- Frontend: 8 passed; lint และ production build ผ่าน
- Playwright กับ full Docker stack: 4 passed รวม automated WCAG A/AA, 3.6s
- Compose config: `compose.yaml` และ `compose.test.yaml` valid
- Docker: db/backend/frontend healthy, maintenance running และ named-volume data อยู่ครบหลัง restart
- k6 200 VU: 0% error; Evaluation p95 349.71ms/p99 395.52ms; autosave p95 8.87ms;
  submit p95 65.05ms; pairing 839.85ms; recompute 73.96ms — ผ่าน NFR-PERF-01..05
