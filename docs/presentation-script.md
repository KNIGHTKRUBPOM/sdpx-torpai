# UniLib Presentation & Live Demo Script

สคริปต์นี้ออกแบบสำหรับการนำเสนอประมาณ 8–10 นาที ผู้พูดสามารถอ่านประโยคในเครื่องหมายคำพูดได้โดยตรง และตัดส่วน Q&A ออกได้หากเวลาน้อย

## เตรียมก่อนเริ่มโชว์

### Quick run: เปิด Web Local

จาก root ของ repository รัน:

```bash
docker compose up --build -d
docker compose ps
```

รอให้ `db`, `backend` และ `frontend` พร้อม แล้วเปิด:

- Web: `http://localhost:5173`
- Swagger API: `http://localhost:8000/docs`

หากเคย build แล้วและไม่มีการแก้ dependencies ใช้คำสั่งที่เร็วกว่าได้:

```bash
docker compose up -d
```

เตรียม browser สองหน้าต่างตาม URL ด้านบน และ terminal ที่อยู่ root ของ repository ห้ามใช้ `docker compose down -v` ระหว่างนำเสนอ เพราะคำสั่งนั้นลบข้อมูล PostgreSQL ใน volume

บัญชี librarian สำหรับ local demo คือ `librarian@example.com` / `Library123!` เท่านั้น ห้ามนำรหัสนี้ไปใช้ production

## 0:00–1:00 — ปัญหาและเป้าหมาย

> “UniLib แก้ปัญหาที่นักศึกษาไม่รู้ว่าหนังสือว่างหรือไม่ และต้องพึ่งเจ้าหน้าที่ในการยืมคืนทุกครั้ง ระบบนี้ทำให้สมัคร ค้นหา ยืม คืน และติดตามกำหนดคืนได้จากบัญชีเดียว ขณะที่บรรณารักษ์เพิ่ม ลบ และจัดการรายการยืมได้”

ชี้ให้เห็นว่ารอบนี้ตั้งใจไม่ทำการจอง ต่ออายุ และค่าปรับ เพื่อให้ core journey ใช้งานจริงและทดสอบได้ก่อน

## 1:00–2:00 — Architecture

เปิด `docs/architecture.md` หรือ Swagger UI แล้วพูดว่า:

> “Frontend เป็น React/TypeScript, API เป็น FastAPI, ข้อมูลจริงอยู่ PostgreSQL และ schema เปลี่ยนผ่าน Alembic การยืนยันตัวตนใช้ JWT 12 ชั่วโมง ส่วน business rules อยู่ใน service layer จึงทดสอบได้โดยไม่ต้องเปิด browser”

จุดที่ควรชี้:

- UUID ของ user/book/loan สร้างโดย backend
- Student ID มาจากข้อมูลสมัครและห้ามซ้ำ
- การยืมล็อก row และฐานข้อมูลบังคับหนึ่ง active loan ต่อหนังสือ
- รหัสผ่านเก็บเป็น Argon2 hash ไม่เก็บ plaintext

## 2:00–4:30 — Student Journey

1. เปิด `/register` และสมัครนักศึกษาด้วยข้อมูล demo ที่ยังไม่เคยใช้
2. ค้นหาหนังสือด้วยชื่อ ผู้แต่ง หรือ ISBN
3. กด “ยืมหนังสือ” แล้วชี้ว่าสถานะเปลี่ยนทันที
4. เปิด “หนังสือของฉัน” และชี้กำหนดคืน +14 วัน
5. กดคืน แล้วแสดงว่าเล่มนั้นกลับเป็นพร้อมยืม

> “ผู้ใช้ไม่ต้องกรอก Student ID ซ้ำตอนยืม เพราะ backend อ่านตัวตนจาก JWT การตัดสินใจว่ายืมได้หรือไม่ได้เกิดที่ server จึงข้ามกฎด้วยการแก้หน้าเว็บไม่ได้”

## 4:30–5:30 — Librarian Journey

Logout แล้ว login ด้วยบัญชี librarian จากนั้น:

1. เปิดหน้าจัดการหนังสือและกรอก ISBN-10 หรือ ISBN-13
2. แสดงว่าระบบตัดช่องว่าง/ขีด และปฏิเสธ ISBN ซ้ำ
3. เปิดรายการยืมทั้งหมดและสาธิตรับคืนแทนนักศึกษา

> “Role ถูกตรวจทั้ง route ฝั่ง frontend และ authorization ฝั่ง backend นักศึกษาจึงเปิดหน้า admin หรือเรียก API เพิ่มหรือลบหนังสือไม่ได้”

## 5:30–8:00 — เล่นกับ Unit Test แบบ Red–Green

เปิด `backend/tests/unit/test_library_services.py` คู่กับ `backend/src/services/loan_service.py`

### เตรียมครั้งเดียวก่อนนำเสนอ

Build image สำหรับ test ล่วงหน้า:

```bash
docker compose -p unilib-test -f compose.test.yaml build e2e
```

ระหว่าง demo ใช้คำสั่งนี้ทุกครั้ง คำสั่ง `-v "$PWD/backend:/workspace/backend"` ทำให้ container อ่านโค้ดล่าสุดจากเครื่อง จึงไม่ต้อง build ใหม่หลังแก้ `14` เป็น `13` หรือเปลี่ยนกลับ:

```bash
docker compose -p unilib-test -f compose.test.yaml run --rm --no-deps \
  -v "$PWD/backend:/workspace/backend" \
  e2e sh -c "cd /workspace/backend && python -m pytest tests/unit/test_library_services.py::test_borrow_sets_due_date_and_return_restores_availability -q"
```

### ทางเลือกสำรอง: Python Local

แนะนำ Python `3.12` เพื่อให้ตรงกับ `backend/Dockerfile` แต่ local ใช้ Python `3.10` ขึ้นไปได้ เครื่องนี้ทดสอบด้วย Python `3.13.7` แล้ว เตรียม environment ครั้งเดียวจาก root ของ repository:

```bash
python3 --version
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

หากสร้าง `.venv` และติดตั้ง dependencies ไว้แล้ว ก่อน demo ใช้เพียง:

```bash
source .venv/bin/activate
cd backend
python -m pytest tests/unit/test_library_services.py::test_borrow_sets_due_date_and_return_restores_availability -q
```

คำสั่งนี้ยังทดสอบ `LoanService` จริง แต่ใช้ SQLite in-memory จึงไม่ต้องเปิด PostgreSQL หรือ Web server การแก้ไฟล์บนเครื่องมีผลกับ test รอบถัดไปทันที

### ขั้นที่ 1: Green — ยืนยันว่ากฎปัจจุบันผ่าน

เลือกใช้คำสั่ง Docker หรือ Python Local ด้านบน แล้วรันคำสั่งเดิมในทุกช่วง ต้องเห็น `1 passed`

ชี้โค้ดสองจุด:

- Test ล็อกเวลาไว้ที่ `12 กันยายน 2026` และคาด due date เป็น `26 กันยายน 2026`
- `LoanService.borrow` คำนวณ `borrowed_at + timedelta(days=14)`

> “Unit test เรียก LoanService ตัวเดียวกับระบบจริง แต่ใช้ SQLite in-memory และฉีด clock คงที่เป็นวันที่ 12 กันยายน กฎ 14 วันจึงต้องได้วันที่ 26 กันยายน ผลไม่ขึ้นกับวันที่นำเสนอ”

### ขั้นที่ 2: ทำให้กฎเสียโดยตั้งใจ (Red)

ใน `backend/src/services/loan_service.py` ที่เมธอด `LoanService.borrow` เปลี่ยนชั่วคราว:

```python
due_at=borrowed_at + timedelta(days=14)
```

เป็น:

```python
due_at=borrowed_at + timedelta(days=13)
```

รันคำสั่งเดิมโดยไม่ต้อง build ใหม่ ต้องเห็น `1 failed` พร้อมค่าที่ต่างกัน:

```text
Expected: 2026-09-26
Actual:   2026-09-25
```

> “เมื่อ production code บวกเพียง 13 วัน Service คืนวันที่ 25 แต่ test ยังยืนยัน business rule 14 วันว่าต้องเป็นวันที่ 26 จึงเกิด Red”

### ขั้นที่ 3: คืนกฎและเห็น Green

เปลี่ยนกลับเป็น `timedelta(days=14)` แล้วรันคำสั่งเดิมอีกครั้ง ต้องได้ `1 passed`

> “เมื่อคืนกฎเป็น 14 วัน ผลลัพธ์กลับมาตรงกับข้อกำหนดและ test เป็น Green”

### ขั้นที่ 4: ตรวจว่าไม่ทิ้งโค้ดผิดไว้

```bash
git diff --check
git status --short
```

ตัวเลือกสำรอง: เปลี่ยนเงื่อนไขจำกัดการยืมจาก `>= 5` เป็น `>= 6` แล้วรัน:

```bash
docker compose -p unilib-test -f compose.test.yaml run --rm --no-deps \
  -v "$PWD/backend:/workspace/backend" \
  e2e sh -c "cd /workspace/backend && python -m pytest tests/unit/test_library_services.py::test_borrow_rejects_sixth_active_loan -q"
```

อย่าจบ demo โดยทิ้งโค้ดที่แก้ให้ผิดไว้ ตรวจให้แน่ใจว่าเปลี่ยนกลับและ `git diff --check` ไม่มี error

## 8:00–9:00 — Test Pyramid และหลักฐาน

```bash
docker compose -p unilib-test -f compose.test.yaml up --build --abort-on-container-exit --exit-code-from e2e
```

ผลอ้างอิงปัจจุบัน:

- Backend 28 tests และ coverage 91%
- Frontend 4 component tests
- Playwright 4 critical journeys
- คำสั่งคืน exit code 0 เมื่อทั้งหมดผ่าน และ non-zero เมื่อ suite ใดล้ม

> “Unit tests ให้ feedback เร็วกับ business rules, API integration tests ตรวจ auth/status/error shape และ E2E พิสูจน์ journey จริงผ่าน React, FastAPI และ PostgreSQL เราไม่ได้ใช้ E2E แทนทุกอย่างเพราะช้าและวิเคราะห์สาเหตุยากกว่า unit test”

## 9:00–10:00 — Future Work และปิดการนำเสนอ

เปิด `docs/future-work.md` แล้วเลือกพูดเพียงสามรายการ: เชื่อมทะเบียน/SSO, รองรับหลาย physical copies ต่อ ISBN และระบบแจ้งเตือน/จอง/ต่ออายุ

> “WS1–5 จบที่ core flow ซึ่ง deploy และทดสอบซ้ำได้ Roadmap ถัดไปเริ่มจาก production security และ CI ก่อนขยาย domain ของห้องสมุด เพื่อไม่เพิ่มฟีเจอร์บนฐานที่ยังวัดผลไม่ได้”

## คำสั่ง Unit Test สำหรับตอบคำถามสด

จากโฟลเดอร์ `backend` เมื่อใช้ Python environment ในเครื่อง:

```bash
python -m pytest -q
python -m pytest tests/unit/test_library_services.py -vv
python -m pytest -k "borrow or return" -vv
python -m pytest -x
python -m pytest --lf
python -m pytest --cov=src --cov-report=term-missing
```

- `-k` เลือก test ตามชื่อ
- `-x` หยุดที่ failure แรก
- `--lf` รันเฉพาะ test ที่ล้มล่าสุด
- `-vv` แสดงชื่อ test ละเอียด
- `--cov` แสดงส่วนของ production code ที่ยังไม่มี test ครอบคลุม

## Q&A ที่มีโอกาสถูกถาม

**ทำไมใช้ UUID?** ลดการเดาจำนวนข้อมูลและสร้าง ID ได้โดยไม่พึ่ง sequence กลาง

**ป้องกันคนสองคนยืมเล่มเดียวกันอย่างไร?** ใช้ transaction/row lock และ unique partial index สำหรับ active loan

**ทำไม test ไม่ใช้เวลาปัจจุบันจริง?** ฉีด clock เพื่อให้ผลซ้ำได้และไม่เกิด flaky test

**ข้อมูลหายไหมเมื่อ restart?** Dev compose ใช้ named volume จึงยังอยู่; test compose ใช้ `tmpfs` จึงเริ่มใหม่ทุกครั้ง

**test reset endpoint ปลอดภัยหรือไม่?** Route ถูก register เฉพาะ `APP_ENV=test` และยังต้องส่ง secret header
