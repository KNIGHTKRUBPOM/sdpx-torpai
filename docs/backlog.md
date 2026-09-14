# Revised Product Backlog & User Stories (TorPai - UniLib)

## WS1–5 GitHub backlog

- [#8 Student registration](https://github.com/KNIGHTKRUBPOM/sdpx-torpai/issues/8)
- [#9 Login and logout](https://github.com/KNIGHTKRUBPOM/sdpx-torpai/issues/9)
- [#10 Search the book catalog](https://github.com/KNIGHTKRUBPOM/sdpx-torpai/issues/10)
- [#11 Filter catalog results](https://github.com/KNIGHTKRUBPOM/sdpx-torpai/issues/11)
- [#12 Librarian adds a book](https://github.com/KNIGHTKRUBPOM/sdpx-torpai/issues/12)
- [#13 Student borrows a book](https://github.com/KNIGHTKRUBPOM/sdpx-torpai/issues/13)
- [#14 Return a book](https://github.com/KNIGHTKRUBPOM/sdpx-torpai/issues/14)
- [#15 View my active loans](https://github.com/KNIGHTKRUBPOM/sdpx-torpai/issues/15)
- [#16 Librarian manages all loans](https://github.com/KNIGHTKRUBPOM/sdpx-torpai/issues/16)
- [#19 Librarian removes an available book](https://github.com/KNIGHTKRUBPOM/sdpx-torpai/issues/19)

Each story contains binary acceptance criteria and maps directly to the API operations in `docs/openapi.yaml` and the automated tests in `backend/tests` / `frontend/tests`. The complete traceability map is in [`requirements.md`](requirements.md).

## 📌 Context & Revised User Stories (From Presentation Feedback)

ตาม Feedback จากการนำเสนอระบบยืม-คืนหนังสือดิจิทัล (UniLib) ของทีม **ต่อไป (TorPai)** ได้ทำการปรับปรุง User Stories และ Acceptance Criteria ให้ชัดเจน รัดกุม และสามารถวัดผลด้วย Unit Tests & E2E Tests ได้ดังนี้:

---

### 🟢 Epic 1: การค้นหาและตรวจสอบสถานะหนังสือ (Search & Catalog)

#### User Story 1.1: ค้นหาหนังสือตามคำค้นหา
- **As a** นิสิต/นักศึกษา
- **I want to** ค้นหาหนังสือด้วย ชื่อหนังสือ, ผู้แต่ง หรือ รหัส ISBN
- **So that** สามารถตรวจสอบว่ามีหนังสือที่ต้องการอยู่ในห้องสมุดหรือไม่

**Acceptance Criteria:**
- [x] เมื่อพิมพ์คำค้นหาในช่อง ค้นหา ระบบจะกรองรายการหนังสือแบบ Real-time
- [x] หากไม่พบหนังสือ ระบบจะแสดงสถานะ "ไม่พบหนังสือที่ตรงกับคำค้นหา"
- [x] แสดงแท็กสถานะ `available` (พร้อมยืม) หรือ `borrowed` (ถูกยืมแล้ว) อย่างชัดเจน

---

### 🔵 Epic 2: การยืมและคืนหนังสือดิจิทัล (Borrow & Return Service)

#### User Story 2.1: ยืมหนังสือด้วยรหัสนักศึกษาและ ISBN
- **As a** นิสิต/นักศึกษา
- **I want to** ทำรายการยืมหนังสือด้วยการระบุรหัสนักศึกษาและ ISBN
- **So that** ยืมหนังสือได้ทันทีโดยไม่ต้องผ่านเคาน์เตอร์เจ้าหน้าที่

**Acceptance Criteria:**
- [x] ต้องกรอกรหัสนักศึกษา และ รหัส ISBN ครบถ้วน
- [x] หากหนังสือสถานะ `available` ระบบจะเปลี่ยนสถานะเป็น `borrowed` พร้อมบันทึกวันกำหนดคืน (+14 วัน)
- [x] แสดง Toast Notification แจ้งผลการยืมสำเร็จ

#### User Story 2.2: คืนหนังสือผ่านรหัสบาร์โค้ด / ISBN
- **As a** นิสิต/นักศึกษา
- **I want to** คืนหนังสือผ่านระบบออนไลน์ด้วยการกรอก/สแกน ISBN
- **So that** หนังสือถูกคืนเข้าสู่ระบบอัตโนมัติ

**Acceptance Criteria:**
- [x] ตรวจสอบรหัส ISBN ในระบบ
- [x] ปรับสถานะหนังสือกลับเป็น `available`
- [x] แสดงการแจ้งเตือนคืนสำเร็จทันที

---

### 🟣 Epic 3: แดชบอร์ดและประวัติการยืม (My Books Dashboard)

#### User Story 3.1: ตรวจสอบรายการหนังสือที่ถือครองอยู่
- **As a** นิสิต/นักศึกษา
- **I want to** ดูรายการหนังสือที่กำลังยืมอยู่และกำหนดวันคืน
- **So that** วางแผนการคืนหนังสือได้ตรงเวลาและป้องกันค่าปรับ

**Acceptance Criteria:**
- [x] แสดงรายการหนังสือที่ยืมอยู่ พร้อมวันที่ต้องคืน
- [x] มีปุ่มทางลัดสำหรับกด "คืนหนังสือเล่มนี้" ได้ในคลิกเดียว
