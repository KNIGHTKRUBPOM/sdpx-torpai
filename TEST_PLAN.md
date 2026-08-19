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

## Fidelity Check (WS-03)

- Target rule: `SCORE-01` — ใช้เฉพาะ comparison สถานะ `SUBMITTED`
- Mutation: ลบตัวกรอง `point.status == ComparisonStatus.SUBMITTED` ชั่วคราวใน `ScoringService.quality_index`
- Test ที่แดง: `test_quality_index_uses_submitted_comparisons_and_fractional_weights_only`
- ผลจริง: **1 failed in 0.13s**; ค่า `q` ผิดจาก `0.666…` เป็น `0.00985…` เพราะ draft น้ำหนัก 100 หลุดเข้าคำนวณ
- Restore: คืน production rule แล้วและรัน full suite ผ่านอีกครั้ง ✅

## กฎที่ยังไม่มี automated test (ยอมรับชั่วคราว)

- Google OIDC, hosted-domain restriction และ cross-classroom authorization — integration/security tests เมื่อ production auth adapter พร้อม
- Atomic CSV import/formula injection — unit + integration tests ใน Classroom adapter implementation
- Autosave debounce/network retry/revision audit — API integration + Playwright ใน WS-04
- PostgreSQL uniqueness, immutable final snapshot และ append-only audit storage — database integration tests หลัง migration
- Student anonymity across every endpoint/export — negative security suite ก่อน M3; ห้าม release จริงโดยไม่มีชุดนี้
- NFR performance/a11y — k6 และ automated/manual accessibility suite ใน milestone ที่ PRD ระบุ

## Performance budget

- Backend unit suite: `< 10 s`
- Frontend unit suite: `< 10 s`
- Pair generation target: `≤ 10 s` สำหรับ 200 students × 5 criteria (ยังต้องมี performance test แยก)
