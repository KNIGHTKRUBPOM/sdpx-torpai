# Test Plan

## WS1–5 automated verification

- Backend unit/integration: `cd backend && python -m pytest -q --cov=src`
- Frontend component: `cd frontend && npm test`
- Frontend lint/build: `cd frontend && npm run lint && npm run build`
- Full E2E stack: `docker compose -p unilib-test -f compose.test.yaml up --build --abort-on-container-exit --exit-code-from e2e`
- Flaky check: run Playwright with `--repeat-each=3`.

Implemented coverage includes registration/login, password hashing, role authorization, ISBN normalization/duplicates, search, 14-day due dates, five-book limit, double-borrow protection, ownership on return, API error shape, protected navigation, and the student/librarian E2E journeys.

### Fidelity check (WS-03)

Protected rule: an unavailable book must not be borrowed. Temporarily bypassing the `book.status != "available"` guard makes `test_borrow_rejects_already_borrowed` fail because the database prevents a second active loan. The production guard is restored after the check; this proves the harness detects removal of the rule.

เอกสารแผนการทดสอบระบบยืม-คืนหนังสือ **SDPX - Torpai** ซึ่งรวบรวมข้อกำหนดมาจาก **Key Business Rules** ใน `memory-bank/units/*/unit-brief.md` ทุกข้อ

---

## Functions ที่ต้อง Test

### 1. BorrowService.borrow_book()
- **หนังสือที่มีสถานะ `available` และระบุ Student ID ที่ถูกต้อง** → ยืมสำเร็จ เปลี่ยนสถานะเป็น `borrowed`, ระบุ `borrowed_by` และกำหนดวันคืน (`due_date`)
- **หนังสือถูกยืมไปแล้ว (สถานะเป็น `borrowed`)** → ยืมไม่สำเร็จ แสดงข้อความแจ้งเตือนยืมซ้ำไม่ได้ (`BookAlreadyBorrowedError`)
- **หาหนังสือไม่พบในระบบ (ISBN ไม่ถูกต้อง)** → ยืมไม่สำเร็จ แสดงข้อความไม่พบหนังสือ (`BookNotFoundError`)
- **ไม่ระบุ Student ID (ค่าว่าง)** → ยืมไม่สำเร็จ แสดงข้อความต้องการ Student ID (`InvalidStudentIdError`)
- **หนังสือไม่มี ISBN หรือชื่อเรื่อง (ข้อมูลไม่สมบูรณ์)** → ยืมไม่สำเร็จ Validation Error

### 2. BorrowService.return_book()
- **คืนหนังสือที่มีสถานะ `borrowed`** → คืนสำเร็จ เปลี่ยนสถานะกลับเป็น `available`, เคลียร์ `due_date` และ `borrowed_by` เป็น `None`
- **คืนหนังสือที่ยังไม่ถูกยืม (สถานะเป็น `available`)** → คืนไม่สำเร็จ แสดงข้อความหนังสือไม่ได้ถูกยืมอยู่ (`BookNotBorrowedError`)
- **หาหนังสือไม่พบในระบบ (ISBN ไม่ถูกต้อง)** → คืนไม่สำเร็จ แสดงข้อความไม่พบหนังสือ (`BookNotFoundError`)

### 3. BookCatalogService.search_books()
- **การค้นหาข้อความ (Title, Author, ISBN)** → ต้องทำการจับคู่แบบ Case-insensitive เสมอ
- **การกรองตามหมวดหมู่ (Category)** → คืนเฉพาะรายการหนังสือที่ตรงกับหมวดหมู่ที่เลือก
- **สถานะหนังสือทุกเล่มในผลลัพธ์** → ต้องเป็นได้เพียง `available` หรือ `borrowed` เท่านั้น

### 4. UserBooksService.get_user_borrowed_books()
- **ดึงรายการหนังสือตาม Student ID** → คืนเฉพาะหนังสือที่มีสถานะ `borrowed` และมี `borrowed_by` ตรงกับ Student ID ที่ระบุ
- **ข้อมูลหนังสือของผู้ใช้ทุกเล่ม** → ต้องแสดงวันกำหนดส่งคืน (`due_date`) อย่างชัดเจนเสมอ

### 5. APIGateway / Data Validation
- **Request / Response Payload** → ทุกการรับ-ส่งข้อมูลต้องผ่านการตรวจสอบโครงสร้าง Pydantic Schema
- **กรณีข้อมูลไม่ถูกต้องหรือหาหนังสือไม่เจอ** → ส่ง HTTP Error Code ที่เหมาะสม (400 Bad Request หรือ 404 Not Found) พร้อมข้อความอธิบาย

---

## สถานะ coverage ปัจจุบัน

- Case-insensitive search มี unit test ใน `test_search_is_case_insensitive`
- รายการยืมของผู้ใช้และการคืนมี service/API integration/E2E coverage
- HTTP authorization และ error shape มี FastAPI TestClient coverage
- Backend suite ปัจจุบันมี 22 tests และ line coverage 91% เมื่อรันใน Docker test compose

งานทดสอบลำดับถัดไปคือ PostgreSQL concurrency, migration/restore, OpenAPI contract, JWT expiry/rotation, accessibility และ mobile E2E ตาม `docs/future-work.md`
