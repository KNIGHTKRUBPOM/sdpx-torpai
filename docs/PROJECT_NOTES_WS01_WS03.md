# โน้ตสรุป PairEval — WS-01 ถึง WS-03

เอกสารนี้ใช้ทบทวนสิ่งที่ทำ อธิบายเหตุผลเชิงออกแบบ และเตรียมตอบคำถามอาจารย์ โดยอ้างอิง PairEval PRD v2.0, `memory-bank/`, backlog, API contract และ test suite ใน repository นี้

## 1. สรุปโปรเจกต์ใน 30 วินาที

**PairEval** เป็นเว็บแอป mobile-first สำหรับประเมินผลงานกลุ่มและการมีส่วนร่วมรายบุคคลด้วยการเปรียบเทียบทีละคู่ ผู้ประเมินไม่ให้คะแนนตัวเลขโดยตรง แต่เลือกจาก 6 ระดับว่าฝั่งซ้ายหรือขวาดีกว่ากัน ระบบนำเฉพาะคำตอบที่กด `SUBMITTED` แล้วมาคำนวณเป็นคะแนนที่อธิบายและตรวจสอบย้อนหลังได้ โดยอาจารย์ยังเป็นผู้ review, override และ finalize คะแนนสุดท้าย

ปัญหาที่ต้องการแก้มี 3 เรื่อง:

- **Absolute scoring bias:** มาตรฐานการให้คะแนนอาจเปลี่ยนตามลำดับงานที่ตรวจ
- **Free-rider:** สมาชิกที่ทำงานไม่เท่ากันอาจได้คะแนนกลุ่มเท่ากัน
- **Peer rating inflation:** การให้คะแนนเพื่อนเป็นตัวเลขตรง ๆ มักกระจุกตัวที่คะแนนสูง

แนวคิดหลักคือ มนุษย์เปรียบเทียบ “A กับ B” ได้สม่ำเสมอกว่าการตอบว่า “A ควรได้กี่คะแนน”

## 2. ทำไมต้องรีโปรเจกต์

repository เดิมพัฒนาเป็นระบบยืม–คืนหนังสือ UniLib แม้มีโครง WS-01–03 แล้ว แต่ไม่ตรงกับหัวข้อจริงใน `project-ideas/pairwise_evaluation_prd.md` จึงรีแฟกเตอร์โดเมนใหม่แทนการสร้าง repository ทิ้งทั้งหมด

สิ่งที่ **เก็บไว้** เพราะยังใช้ได้:

- React 19, TypeScript, Vite และ Tailwind CSS
- FastAPI, Python และ Pydantic
- Vitest, Pytest และ Playwright
- โครง `frontend/`, `backend/`, `docs/`, `memory-bank/`

สิ่งที่ **เปลี่ยนทั้งหมด**:

- Intent, backlog, diagrams, ERD, OpenAPI และ wireframes
- UI จากค้นหา/ยืมหนังสือเป็น assignment/evaluation/score preview
- Business logic จาก BorrowService เป็น PairingService และ ScoringService
- Fake repository, factories, fixtures และ unit tests ให้ตรง PairEval
- README, Agent context, test plan, presentation guide และ work summary

เหตุผลที่ไม่เปลี่ยน framework พร้อมกันคือ การเปลี่ยนโดเมนกับ framework ในรอบเดียวทำให้หาสาเหตุยากเมื่อเกิดปัญหา และเสีย tooling/test loop ที่มีอยู่แล้ว

## 3. งาน WS-01 — Project Context และ deploy-ready scaffold

### 3.1 สร้าง context ให้คนและ AI

เพิ่ม `AGENTS.md` เป็นกติกากลางของ repository มี:

- คำสั่ง install, run, test, lint, build และ E2E
- กติกา TypeScript strict, Python type hints และใช้ `Decimal`
- ห้ามลดความเข้ม test เพื่อให้ผ่าน
- ห้าม commit secrets
- ห้ามเปลี่ยนนโยบาย scoring/pairing แบบเงียบ ๆ
- ต้องรักษา traceability จาก story → API → business rule → test

`Agent.md` เดิมถูกเก็บเป็น compatibility pointer เพื่อไม่ให้ link เก่าพัง แต่ `AGENTS.md` เป็นไฟล์หลัก

### 3.2 อัปเดต project setup

- เขียน `README.md` ใหม่เป็น PairEval
- อัปเดต `memory-bank/standards/tech-stack.md`
- เพิ่ม `.env.example` ที่มีเฉพาะชื่อ key ไม่มี secret
- ปรับ `.gitignore` สำหรับ env, virtual environment, node modules, reports และ artifacts
- เปิด TypeScript `strict: true`

### 3.3 ทำ frontend walking skeleton

หน้าเว็บแบ่งเป็น 3 views:

1. **Overview:** assignment, deadline, progress, coverage และ workload
2. **Evaluation:** เปิดผลงานสองฝั่ง เลือกคำตอบ 1–6 เห็น progress และ save status
3. **Score Preview:** แสดงคะแนนชั่วคราว, group/individual components และ participation

แยก React components เป็น:

- `AssignmentOverview.tsx`
- `EvaluationWorkspace.tsx`
- `ScorePreview.tsx`
- typed demo data และ choice definitions ใน `domain/evaluation.ts`

จุด accessibility ที่ทำแล้ว:

- navigation มี accessible label
- ตัวเลือกใช้ native radio input
- ทุก choice มีข้อความ ไม่สื่อด้วยตำแหน่งหรือสีอย่างเดียว
- radio target มีขนาดอย่างน้อย 24px
- save state ใช้ `aria-live="polite"`
- มี visible focus styles และ semantic heading/fieldset

### 3.4 สิ่งของ WS-01 ที่ยังไม่ปิดจากภายนอก

- ยังไม่ได้ deploy Vercel/Render เพราะต้องใช้ account/สิทธิ์ภายนอก
- ยังไม่มี staging URL และ commit-to-live time ของ PairEval
- ยังไม่ได้ push/เปิด PR จากงานรอบนี้

ตัวโปรเจกต์ local เป็น deploy-ready แต่ห้ามบอกว่า WS-01 สมบูรณ์ 100% จนกว่าจะมี Live URL และวัด deploy loop จริง

## 4. งาน WS-02 — Requirements และ API Design

### 4.1 Intent และขอบเขต

`memory-bank/intent.md` ระบุ:

- ปัญหา ผู้ใช้ และคุณค่าของระบบ
- success metrics เช่น participation ≥ 90% และเวลาประเมิน median ≤ 15 นาที
- decisions ที่ตัดสินแล้ว เช่น 6-point forced choice และ band mapping
- out of scope ถึง WS-03 เช่น LMS, production OIDC, PostgreSQL และ email
- open questions ที่ต้องให้อาจารย์/ฝ่ายวิชาการตัดสินก่อน M2

ค่า open question ที่ implementation ใช้ตอนนี้เป็น default จาก PRD เช่น score floor `0.60` และ participation multiplier คูณคะแนนส่วนบุคคลรวม

### 4.2 Product Backlog

เขียน backlog 8 stories พร้อม Given/When/Then:

1. `US-01` สร้าง classroom
2. `US-02` import roster แบบ atomic
3. `US-03` ตั้ง assignment และ criteria
4. `US-04` preview pairing feasibility
5. `US-05` publish และ generate pairs
6. `US-06` ทำ six-choice evaluation
7. `US-07` resume, submit และ re-submit
8. `US-08` ดู interim score และ participation

แต่ละ story trace ไป endpoint และ unit rule ได้ ไม่มี endpoint ที่สร้างขึ้นมาโดยไม่มี story รองรับ

GitHub Issues/Project จริงยังไม่ได้สร้าง เพราะเป็น external operation; backlog ฉบับ authoritative ตอนนี้อยู่ใน `docs/backlog.md`

### 4.3 Architecture

แบ่งระบบเป็น units ที่ coupling ต่ำ:

- **Classroom & Assignment:** roster, role scope และ lifecycle ก่อน publish
- **Pairing Engine:** feasibility และการกระจาย pair
- **Evaluation Flow:** draft, submit, progress และหน้าจอ
- **Scoring Engine:** แปลง comparison เป็นคะแนนแบบ pure function

หลักสำคัญ:

- HTTP/Pydantic อยู่ที่ API boundary ไม่ปนกับสูตร domain
- Pairing/Scoring ไม่ขึ้นกับ database จริง จึงทดสอบผ่าน repository interface/fake ได้
- Pair assignments ต้องสร้างและบันทึกตอน publish ไม่สุ่มใหม่ตอนเปิดหน้า
- Scoring ต้อง deterministic และไม่มี state ภายใน
- Target database คือ PostgreSQL ส่วน WS-03 ใช้ in-memory adapter/fake

### 4.4 ER Diagram

entity หลักที่ออกแบบไว้:

- `USER`, `CLASSROOM`, `CLASSROOM_MEMBER`, `GROUP_ENTITY`
- `ASSIGNMENT`, `CRITERION`, `PAIR_ASSIGNMENT`
- `COMPARISON`, `COMPARISON_REVISION`
- `COMPUTED_SCORE`, `AUDIT_EVENT`

เหตุผลที่แยก `COMPARISON` กับ `COMPARISON_REVISION` คือ comparison เก็บคำตอบปัจจุบัน ส่วน revision เก็บประวัติ re-submit เพื่อ audit ได้

เหตุผลที่ `PAIR_ASSIGNMENT` ต้องเก็บ `display_left_item_id` คือระบบสุ่มตำแหน่งซ้าย/ขวา ถ้าไม่เก็บตำแหน่งจริง เราจะแปล choice กลับไปหา item ผิด

### 4.5 OpenAPI 3.1

ทำ contract ครอบคลุม 9 operations หลัก เช่น:

- create classroom
- atomic roster import
- create assignment
- feasibility preview
- publish
- get my evaluations
- idempotent draft save
- submit ด้วย `Idempotency-Key`
- get privacy-safe score

API ใช้ error envelope รูปเดียวกัน:

```json
{
  "error": {
    "code": "ASSIGNMENT_NOT_FOUND",
    "message": "Assignment was not found.",
    "field": null,
    "requestId": "..."
  }
}
```

`code` มีไว้ให้ client ใช้แบบคงที่, `message` มีไว้ให้คนอ่าน และ `requestId` ใช้ตาม log เมื่อ debug

OpenAPI ผ่าน Redocly validation โดยไม่มี error/warning

### 4.6 Wireframes

ทำ Excalidraw 3 screens:

- Instructor dashboard
- Assignment setup + feasibility preview
- Student evaluation บน mobile

หน้าผลคะแนนถูกรวมต่อจาก evaluation flow เพื่อควบคุม scope M1 และลดหน้าจอที่ยังไม่จำเป็น

## 5. งาน WS-03 — Unit Test Harness และ E2E

### 5.1 Test structure

backend มี:

- `tests/fakes/fake_pair_assignment_repo.py`
- `tests/factories.py`
- `tests/conftest.py`
- `tests/unit/test_pairing_service.py`
- `tests/unit/test_scoring_service.py`
- `tests/test_main.py`

frontend มี:

- `src/App.test.tsx`
- `src/test/setup.ts`
- `tests/e2e.spec.ts`

### 5.2 Fake, Factory และ Fixture ต่างกันอย่างไร

- **Fake:** implementation ที่ทำงานจริงแบบง่าย เช่น repository ใน memory ไม่เรียก PostgreSQL
- **Factory:** function สร้าง test data หลายรูปแบบโดย override ค่าเฉพาะที่ test สนใจ
- **Fixture:** จัด setup/lifecycle/dependency ที่หลาย test ใช้ซ้ำ เช่น service ที่ถูก inject fake repo แล้ว

เลือก Fake แทน mock-heavy approach เพราะ PairingService ต้องมี behavior ของ storage เล็กน้อย แต่ unit test ไม่ควรช้าหรือพึ่ง database

### 5.3 Pairing Engine

#### คำศัพท์

- `N` = จำนวนกลุ่ม
- `S` = จำนวนนักศึกษาทั้งหมด
- `P = C(N,2)` = จำนวนคู่กลุ่มที่เป็นไปได้
- `R` = coverage เป้าหมาย หรือจำนวน evaluator ต่อ pair
- `k = ceil(P × R / S)` = workload ต่อ evaluator ต่อ criterion
- `k_max` = workload สูงสุดที่ยอมรับ

#### กฎที่ปกป้อง

- evaluator ห้ามได้ pair ที่มีกลุ่มตัวเอง
- evaluator ห้ามได้ pair เดิมซ้ำ
- coverage ของ pair ใด ๆ ต่างกันไม่เกิน 1
- workload ของ evaluator ต่างกันไม่เกิน 1
- input + seed เดิมต้องได้ผลเดิม รวม display side
- ถ้า target coverage ทำไม่ได้ ต้องลดเป็นค่าสูงสุดที่ feasible และบอกเหตุผลเป็นตัวเลข

#### ตัวอย่าง 12 คน 3 กลุ่ม

แต่ละกลุ่มมี 4 คน:

```text
P = C(3,2) = 3 pairs
target R = 5
slots = 3 × 5 = 15
k = ceil(15/12) = 2
```

แต่ evaluator ของกลุ่มหนึ่งประเมินได้แค่คู่ของอีกสองกลุ่ม จึงทำได้ 1 pair ต่อ criterion เท่านั้น ค่า `R=5` ใช้ไม่ได้

ลดเป็น:

```text
R = 4
slots = 3 × 4 = 12
k = ceil(12/12) = 1
```

ผลคือ coverage 4 ต่อ pair และ workload 1 ต่อคน ซึ่งไม่ซ้ำและไม่ผิด self-group rule

#### ทำไมใช้ max-flow

การเลือก evaluator แบบสุ่มหรือ greedy อย่างเดียวอาจจบด้วยบาง pair คนไม่ครบ แม้ภาพรวมจำนวน slot เพียงพอ จึงสร้าง flow network:

- source → student ตาม target workload
- student → pair เฉพาะ pair ที่มีสิทธิ์
- pair → sink ตาม coverage ที่ต้องการ

ถ้า max flow เท่ากับจำนวน slot ทั้งหมด แปลว่ามี allocation ที่ทำตาม constraints ได้ การกำหนด target load เป็น floor/ceiling ทำให้ workload ต่างกันไม่เกิน 1

### 5.4 Individual feasibility

ภายในกลุ่มขนาด `m`:

```text
pairs ทั้งหมด          = C(m,2)
pairs ที่คนหนึ่งทำได้  = C(m-1,2)
coverage แบบ complete  = m-2
```

- `m ≤ 2`: ปิด individual evaluation เพราะไม่มีคู่อื่นให้ประเมิน
- `m = 3`: ทำได้แต่ flag low confidence
- `m = 5`: workload 6 และ coverage 3
- `m = 8`: workload complete สูงเกิน จึงถูก cap และ coverage อาจเป็น 2–3

### 5.5 Scoring Engine

#### Choice mapping

6 ตัวเลือกไม่มีค่ากลาง:

```text
1: ซ้าย 1.0 / ขวา 0.0
2: ซ้าย 0.8 / ขวา 0.2
3: ซ้าย 0.6 / ขวา 0.4
4: ซ้าย 0.4 / ขวา 0.6
5: ซ้าย 0.2 / ขวา 0.8
6: ซ้าย 0.0 / ขวา 1.0
```

ทุกคู่รวมกันเป็น 1.0 และไม่มี `0.5/0.5` เพื่อบังคับให้ตัดสิน

#### Quality index

```text
q(i,c) = Σ(weight × score) / Σ(weight)
```

ใช้เฉพาะ comparison สถานะ `SUBMITTED`; draft และ excluded ไม่เข้าคำนวณ

student weight default = 1.0 ส่วน instructor weight เป็นทศนิยมได้ ไม่ใช้วิธี duplicate vote เพราะจะบิดจำนวน comparison

#### Band mapping

```text
score_ratio = floor + (ceiling - floor) × q
default floor = 0.60
default ceiling = 1.00
```

ดังนั้น:

- `q=0` → 60%
- `q=0.5` → 80%
- `q=1` → 100%

ไม่ normalize ให้คะแนนรวมทุก item เท่ากับ 1 เพราะถ้ามี 10 กลุ่ม ค่าเฉลี่ยจะประมาณ 0.1 และเมื่อคูณคะแนนเต็มจะกลายเป็นคะแนนตกทั้งห้อง ทั้งที่โจทย์ต้องการวัดระดับคุณภาพในช่วง 60–100%

#### Criterion และ component score

```text
criterion_score = score_ratio × (weight_pct/100) × side_max_score
component_score = ผลรวม criterion_score ทุกเกณฑ์
```

น้ำหนัก criteria ของ side ที่เปิดใช้งานต้องรวม 100% ± 0.01

#### Participation multiplier

```text
p = submitted / assigned
M = min(1, p / 0.90)
personal_score = (group_component + individual_component) × M
```

คะแนน group component ของเพื่อนร่วมกลุ่มไม่เปลี่ยนเพราะสมาชิกคนหนึ่งไม่ประเมิน การลดเกิดกับ personal score ของคนที่ participation ไม่ครบ

### 5.6 Golden test จาก PRD

ใช้ตัวอย่าง §9.5 เป็น expected result ที่ตายตัว:

- group component = `12.798 / 15`
- individual component ของคนที่ทำครบ = `4.130 / 5`
- final complete = `16.93 / 20`
- คนที่ participation `0.60` มี multiplier `0.667`
- final incomplete = `10.97 / 20`

ถ้ามีคนเปลี่ยน floor, weight, choice mapping หรือ participation policy โดยไม่ได้ตั้งใจ golden test จะแดง

### 5.7 ทำไมใช้ Decimal

คะแนนเป็นข้อมูลที่ต้อง reproducible และอาจ snapshot/finalize การใช้ binary float อาจเกิดค่าเช่น `0.1 + 0.2 != 0.3` ในระดับ representation จึงใช้ Python `Decimal` ใน domain calculation แล้วค่อย serialize ที่ API boundary

### 5.8 API walking skeleton

backend demo ทำ flow หลักแล้ว:

- health/service metadata
- pairing feasibility
- publish และ persist generated pairs ใน memory
- ดึง evaluation ของ demo user
- save draft แบบ idempotent
- submit ด้วย idempotency key
- คำนวณ privacy-safe interim score
- error envelope และ `X-Request-ID`

API ปัจจุบันเป็น **demo mode** ไม่ใช่ production auth; `X-Demo-User` ใช้เฉพาะ walking skeleton และไม่มี seed/reset endpoint ใน production contract

### 5.9 Frontend tests

Vitest ตรวจว่า:

- มีชื่อ PairEval, navigation และ main CTA
- 3 pairs มี radio ทั้งหมด 18 ตัว หรือ 6 choices ต่อ pair
- ไม่มี neutral choice
- เลือกครบแล้ว progress เป็น `3/3`
- save status ถูกประกาศ
- submit แล้วเห็นคะแนนตัวอย่าง `16.93`

เปลี่ยนจาก jsdom เป็น happy-dom เพราะ jsdom รุ่นเดิมไม่รองรับ Node 25 ของเครื่องโดยตรง และทำ test loop เกิน budget 10 วินาที หลังเปลี่ยน final run ผ่านใน 7.40 วินาที

### 5.10 E2E tests

Playwright Chromium ตรวจ 2 flows:

1. homepage มี title, navigation และ CTA
2. เข้า evaluation → เลือก 3 คำตอบ → progress `3/3` → submit → เห็น result

Final run: 2 tests ผ่านใน 2.5 วินาทีเมื่อ dev server พร้อม

### 5.11 Fidelity check หรือ break-it-live

เพื่อพิสูจน์ว่า test ไม่ได้เขียวแบบไม่มีความหมาย ได้ลบเงื่อนไขนี้ชั่วคราว:

```python
point.status == ComparisonStatus.SUBMITTED
```

ผลคือ draft ที่มี weight 100 หลุดเข้าคำนวณ ค่า `q` เปลี่ยนจาก `0.666…` เป็น `0.00985…` และ test `test_quality_index_uses_submitted_comparisons_and_fractional_weights_only` แดงใน 0.13 วินาที

จากนั้นคืน production rule และรัน full suite ผ่านอีกครั้ง นี่พิสูจน์ว่า test ปกป้อง business rule จริง ไม่ใช่แค่เพิ่ม coverage

### 5.12 ผล verification ล่าสุด

- Backend: 23 tests ผ่านใน 1.62 วินาที
- Backend source coverage: 90%
- Frontend: 3 tests ผ่านใน 7.40 วินาที
- Oxlint: ผ่าน
- TypeScript + Vite production build: ผ่าน
- Playwright: 2 tests ผ่านใน 2.5 วินาที
- OpenAPI Redocly validation: ผ่าน ไม่มี error/warning
- npm audit หลัง fix: 0 vulnerabilities
- Excalidraw JSON ทั้ง 3 ไฟล์ validate ได้

backend ถูกตรวจใน official Python 3.12 container เพราะ local Python เป็น MSYS build ที่ไม่มี compatible `pydantic-core` wheel ปัญหานี้เป็นเรื่อง environment ไม่ใช่ fallback ใน production code

## 6. Coverage กับ Fidelity ต่างกันอย่างไร

- **Coverage** บอกว่า test วิ่งผ่านบรรทัด/branch กี่เปอร์เซ็นต์
- **Fidelity** บอกว่าเมื่อ business rule พัง test จะแดงจริงหรือไม่

coverage สูงอาจยังไม่มีประโยชน์ถ้า assertions ไม่ตรวจผลสำคัญ จึงใช้ทั้ง coverage 90%, business-rule test names, golden test และ break-it-live

## 7. Unit test กับ E2E ต่างกันอย่างไร

- Unit test ของ Pairing/Scoring รันเร็ว แยก dependency และชี้ rule ที่พังได้ตรง
- Component test ตรวจ behavior ของ React โดยไม่เปิด browser จริง
- E2E เปิด Chromium และตรวจ user flow ตั้งแต่หน้าแรกจนเห็นผล

ถ้ามีแต่ E2E จะ debug ยากและช้า ถ้ามีแต่ unit test จะไม่รู้ว่า wiring/UI จริงใช้งานได้หรือไม่ จึงใช้ test pyramid

## 8. เรื่อง Privacy และ Security ที่ออกแบบไว้

- student ไม่เห็น evaluator identity
- ไม่แสดง score delta รายวัน เพราะอาจอนุมานคนที่เพิ่งส่งได้
- individual score ต้องมี evaluator submit ถึง k-anonymity threshold ก่อน
- access evaluator identity ใน target architecture ต้อง audit
- API ทุก resource ต้องตรวจ role และ classroom scope ฝั่ง server
- cross-classroom resource ควรตอบ 404 ไม่ใช่ 403 เพื่อลด information leakage
- secrets อยู่ใน environment variables

อย่างไรก็ตาม production OIDC, PostgreSQL authorization integration และ negative anonymity tests ยังไม่เสร็จ จึงยังไม่ควรใช้กับข้อมูลนักศึกษาจริง

## 9. สิ่งที่ยังไม่ได้ทำและห้ามตอบว่าเสร็จแล้ว

- Google OIDC และ hosted-domain restriction
- PostgreSQL repositories/migrations
- atomic CSV roster importer และ formula-injection protection implementation
- append-only audit storage และ immutable final snapshots
- UI เชื่อม API persistence ครบทุกหน้าจอ
- export CSV/XLSX, appeals และ notification
- integration/security/anonymity test suite
- k6 performance test และ full WCAG audit
- GitHub Issues/Project board จริง
- staging deployment, Live URL และ commit-to-live measurement

สิ่งเหล่านี้ถูกระบุใน PRD/backlog/test plan เป็น accepted gaps หลัง WS-03 ไม่ได้ถูกซ่อนหรือทำ fallback ปลอม

## 10. คำถามที่อาจารย์น่าจะถาม

### ทำไมเลือก pairwise comparison

เพราะผู้ประเมินตัดสินสองสิ่งพร้อมกันได้สม่ำเสมอกว่าการตั้งคะแนน absolute และช่วยลด peer rating inflation แต่ยังต้องมี coverage, quality signals และ instructor review ไม่ใช่ถือว่าคำตอบทุกอันเชื่อถือได้เท่ากัน

### ทำไมมี 6 ตัวเลือกและไม่มี “เท่ากัน”

จำนวนคู่บังคับให้เลือกซ้ายหรือขวา ไม่มี neutral midpoint จึงลด central tendency bias ทุกตัวเลือกมีข้อความเพื่อ accessibility และความหมายไม่ขึ้นกับเลขอย่างเดียว

### ทำไมต้องสุ่มซ้าย/ขวา

ลด position bias ที่ผู้ประเมินอาจชอบฝั่งเดิม แต่ต้องเก็บ `display_left_item_id` เพื่อแปลงคำตอบกลับไปหา item ให้ถูก

### ทำไม seed เดิมต้องได้ผลเดิม

เพื่อ reproduce bug, audit assignment และอธิบายได้ว่าผู้ประเมินได้รับ pair อะไร ถ้าสุ่มใหม่ทุกครั้ง debug และตรวจข้อร้องเรียนไม่ได้

### ทำไมไม่สุ่ม pair ตอนเปิดหน้า

coverage/workload จะควบคุมไม่ได้ ผู้ใช้ refresh แล้วอาจได้งานใหม่ และ audit ไม่ได้ จึง generate + persist ตอน publish

### ทำไม target coverage 5 บางห้องได้แค่ 4

coverage ไม่ได้เป็นค่าที่สั่งได้อิสระ มันติดข้อจำกัดจำนวน evaluator ที่ไม่อยู่ในสองกลุ่ม, workload cap และห้าม pair ซ้ำ ระบบต้องลดเป็นค่าสูงสุดที่ทำได้พร้อมเหตุผลตัวเลข

### ทำไมใช้ max-flow ไม่ใช้ random อย่างเดียว

random อาจกระจายไม่ครบหรือไม่สมดุลแม้จำนวนรวมดูพอ max-flow ตรวจว่ามี allocation ที่ satisfy capacity ของ student/pair จริง

### ทำไมใช้ repository interface

แยก domain logic ออกจาก storage ทำให้ unit test ใช้ fake ได้เร็ว และภายหลังเปลี่ยนจาก in-memory เป็น PostgreSQL adapter โดยไม่แก้สูตร PairingService

### Fake ต่างจาก Mock อย่างไร

Fake มี behavior จริงแบบง่ายและเก็บ state ใน memory ส่วน mock มักเน้นกำหนด return/ตรวจ interaction งานนี้ต้องการทดสอบผล allocation มากกว่าลำดับ call จึงใช้ fake เหมาะกว่าและไม่ over-mock

### Factory ต่างจาก Fixture อย่างไร

Factory สร้างข้อมูลตาม overrides ส่วน fixture จัด setup ที่ test reuse และ lifecycle เช่นสร้าง service ที่ inject fake repo

### ทำไม draft ไม่เข้าคำนวณ

ผู้ใช้ยังไม่ยืนยันและอาจปิดหน้ากลางคัน PRD ระบุชัดว่าใช้เฉพาะ submission ล่าสุด หาก draft เข้า score จะเปลี่ยนโดยผู้ใช้ยังไม่ได้ส่ง

### ทำไม save ใช้ PUT

draft ปัจจุบันมี resource identity คือ pair assignment เดิม การส่ง payload เดิมซ้ำควรได้ state เดิม จึงเหมาะกับ idempotent `PUT`

### ทำไม submit ต้องมี Idempotency-Key

ป้องกัน double submission/revision จากการกดซ้ำหรือ network retry โดย server คืนผลเดิมสำหรับ key เดิม

### ทำไม instructor weight เป็น Decimal/float ไม่ duplicate votes

รองรับน้ำหนักเช่น 1.5 ได้ตรงและไม่ทำให้ comparison count ปลอม การ duplicate vote ใช้ได้เฉพาะจำนวนเต็มและบิด confidence/coverage

### ทำไมไม่ normalize คะแนนรวมเป็น 1

เพราะจะวัดส่วนแบ่งสัมพัทธ์ ไม่ใช่ระดับคุณภาพ จำนวน item มากขึ้นทำให้ทุกคนได้ค่าต่ำลง จึงใช้ band mapping 60–100%

### Participation ลงโทษคนอื่นในกลุ่มไหม

ไม่ shared group component คงเดิม multiplier ถูกใช้กับ personal score ของ evaluator ที่ทำงานไม่ครบเท่านั้น

### ทำไมใช้ Decimal

คะแนนต้องคำนวณซ้ำและ snapshot แล้วได้ค่าเดิมทุกหลัก ลดปัญหาความคลาดเคลื่อนของ binary float

### coverage 90% แปลว่าระบบปลอดภัยไหม

ไม่ Coverage เป็นเพียงสัญญาณว่าบรรทัดถูกวิ่ง ต้องดู assertions และ fidelity ด้วย จึงทำ golden test และ break-it-live เพิ่ม

### ทดสอบอะไรแล้วบ้าง

Pairing invariants, feasibility reduction, individual group sizes, deterministic seed, choice mapping, submitted-only weighted mean, band mapping, criterion weights, participation, PRD golden scores, API health/error contract, React accessibility/progress และ Playwright user flow

### อะไรยังเสี่ยงที่สุด

production authorization/anonymity, atomic roster import, database immutability และ deployment ยังไม่มี integration evidence จึงยังเป็น prototype/WS-03 walking skeleton ไม่ใช่ production-ready system

### AI ทำอะไรและคนตรวจอะไร

AI ช่วยรีแฟกเตอร์ code/docs และเสนอ tests แต่ decisions ยึด PRD, แยก accepted/deferred/rejected scope, รัน verification จริง, ทำ break-test และบันทึก gaps ไม่ถือว่า code ที่ generate ผ่านเพียงเพราะ compile ได้

## 11. สคริปต์พูดประมาณ 2 นาที

> เดิม repository ของทีมเป็นระบบยืมหนังสือซึ่งไม่ตรงหัวข้อ PairEval เราจึงเก็บ React, FastAPI และ test tooling ไว้ แต่เปลี่ยน domain artifacts กับ implementation ทั้งหมดตาม PRD v2.0
>
> ใน WS-01 เราสร้าง AGENTS.md, environment contract และ responsive walking skeleton ที่มี overview, six-choice evaluation และ privacy-safe score preview ส่วน WS-02 เราแปลง PRD เป็น backlog 8 stories, architecture, ERD, OpenAPI 9 operations, unit briefs 4 ส่วน และ wireframes 3 หน้า ทุก endpoint trace กลับหา story ได้
>
> ใน WS-03 เราแยก Pairing Engine กับ Scoring Engine ออกจาก HTTP และ database Pairing Engine คำนวณ feasibility แล้วใช้ max-flow กระจาย pair ให้ coverage กับ workload สมดุล ห้ามประเมินกลุ่มตัวเอง และ seed เดิมได้ผลเดิม Scoring Engine ใช้เฉพาะ submitted comparison, weighted mean, band mapping และ participation multiplier โดยคำนวณด้วย Decimal
>
> เรามี backend 23 tests coverage 90%, frontend 3 tests, E2E 2 tests และ OpenAPI validation ผ่าน จุดสำคัญคือ fidelity check: เมื่อลบ submitted-only rule ค่า q เพี้ยนและ test แดงทันที แปลว่า test ปกป้อง business rule จริง ไม่ใช่แค่ทำ coverage สำหรับ production ยังเหลือ OIDC, PostgreSQL, authorization/anonymity integration และ staging deployment ซึ่งเราเขียนไว้เป็น accepted gaps ชัดเจนครับ

## 12. ลำดับ Demo ที่แนะนำ

1. เปิดหน้า Overview แล้วอธิบาย PairEval/coverage/workload
2. กด “เริ่มประเมิน” ให้เห็น 6 radio choices และ artifact links
3. เลือกคำตอบให้ progress เป็น `3/3` และชี้ autosave status
4. Submit แล้วอธิบาย group component, individual component และ participation
5. เปิด `pairing_service.py` อธิบาย feasibility + max-flow
6. เปิด `scoring_service.py` อธิบาย submitted-only + band mapping
7. เปิด fake/factory/fixture อย่างละหนึ่งตัว
8. รัน backend suite และ coverage
9. ทำ break-it-live submitted-only filter แล้วคืนโค้ด
10. รัน Playwright หรือเปิดผล E2E

## 13. คำสั่งที่ใช้ Demo

```powershell
# Frontend unit tests
cd frontend
npm test

# Lint และ build
npm run lint
npm run build

# E2E
npm run dev
# อีก terminal
npx playwright test --reporter=list
```

ถ้าเครื่องมี CPython มาตรฐาน:

```powershell
python -m pip install -r requirements.txt
cd backend
python -m pytest -q --durations=5 --cov=src --cov-report=term-missing
```

ถ้า terminal อยู่ที่ `backend` แล้ว ให้ใช้
`python -m pip install -r ..\requirements.txt` ก่อน หากคำสั่งไม่รู้จัก `--cov`
แปลว่า environment นั้นยังไม่มีปลั๊กอิน `pytest-cov` ไม่ใช่ test ล้ม

environment ที่ใช้ตรวจรอบนี้รัน backend ด้วย:

```powershell
docker run --rm -v E:\SPDX-torpai:/app -w /app/backend python:3.12-slim `
  sh -lc "pip install -q -r /app/requirements.txt && python -m pytest -q --cov=src"
```

## 14. แผนที่ไฟล์สำหรับเปิดตอบคำถาม

- Product intent: `memory-bank/intent.md`
- Backlog และ acceptance criteria: `docs/backlog.md`
- Architecture: `docs/architecture.md`
- ERD: `docs/erd.md`
- API contract: `docs/openapi.yaml`
- Pairing rules: `memory-bank/units/pairing-engine/unit-brief.md`
- Scoring rules: `memory-bank/units/scoring-engine/unit-brief.md`
- Pairing implementation: `backend/src/services/pairing_service.py`
- Scoring implementation: `backend/src/services/scoring_service.py`
- Fake repository: `backend/tests/fakes/fake_pair_assignment_repo.py`
- Factories: `backend/tests/factories.py`
- Fixtures: `backend/tests/conftest.py`
- Unit tests: `backend/tests/unit/`
- Test plan/fidelity: `TEST_PLAN.md`
- E2E: `frontend/tests/e2e.spec.ts`
- Coverage HTML: `docs/coverage/backend/index.html`
- สรุปงานสั้น: `WORK_SUMMARY.md`

## 15. ประโยคสำคัญที่ควรจำ

- “Pairing และ scoring policy มาจาก PRD ไม่ได้คิดเพิ่มแบบไม่มี trace”
- “Pair assignments ถูก generate ตอน publish และ persist เพื่อ reproducibility”
- “Draft ไม่เข้าคะแนน ใช้เฉพาะ latest submitted revision”
- “Coverage กับ workload เป็นข้อจำกัดที่ผูกกัน ไม่สามารถ fix ทั้งสองค่าโดยไม่ตรวจ feasibility”
- “Group quality กับ participation เป็นคนละเรื่อง คนไม่ประเมินไม่ควรลากคะแนนเพื่อนลง”
- “Coverage สูงไม่เท่ากับ test ดี เราพิสูจน์ fidelity ด้วย break-it-live”
- “ระบบตอนนี้เป็น WS-03 walking skeleton ยังไม่อ้างว่า production-ready”
