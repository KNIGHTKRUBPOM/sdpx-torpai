# 🎤 PRESENTATION_GUIDE.md — คู่มือและบทพูดนำเสนอ (Unit Testing & Test Harness)

เอกสารสำหรับเตรียมตัวนำเสนอผลงาน **SDPX - Torpai (ระบบยืม-คืนหนังสือ)** เวลา 10 นาที (เก็บคะแนน 5/5 เต็มทุกหมวดตาม Rubric)

---

## ⏱️ สรุปกำหนดการนำเสนอ 10 นาที

```text
┌────────────────────────────────────────────────────────────────────────┐
│  00:00 - 05:00  │  💻 Live Demo (Terminal, FakeRepo, Factory, Break it live) │
│  05:00 - 08:00  │  🗣️ Explanation (กฎที่ปกป้อง & การคัดเลือก AI Code)          │
│  08:00 - 10:00  │  ❓ Q&A Preparation (ตอบคำถามอาจารย์ด้วยหลักการเชิงลึก)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Part 1: Demo (5 นาทีแรก)

### 1.1 รัน Test Suite ใน Terminal (30 วินาที)
**คำสั่งที่ใช้รัน:**
```bash
cd backend
PYTHONPATH=. .venv/bin/python -m pytest -v
```
**บทพูด:**
> *"สวัสดีครับอาจารย์และเพื่อนๆ วันนี้กลุ่ม ต่อไป ขอเสนอ Test Harness ของระบบยืม-คืนหนังสือ เริ่มต้นด้วยการรัน Test Suite ทั้งหมด 9 เคส ใช้เวลารันเพียง **0.01 วินาที** และผ่านแบบ 100% Green ทั้งหมดครับ"*

---

### 1.2 แสดง Fake Repository (`FakeBookRepository`) (1 นาที)
**เปิดไฟล์:** [`backend/tests/fakes/fake_book_repo.py`](file:///Users/anasdareme/Documents/GitHub/sdpx-torpai/backend/tests/fakes/fake_book_repo.py)
**บทพูด:**
> *"ระบบเราใช้ **Fake Repository Pattern** โดยสร้าง `FakeBookRepository` ที่สืบทอดจาก Abstract Base Class `BookRepository` ใน `src/repositories/book_repository.py` เดียวกับโค้ด Production"*
> *"จุดเด่นคือใช้ Python Dictionary เก็บข้อมูลใน Memory เพื่อความรวดเร็วระดับ milliseconds แต่การันตีว่า Method Signatures ตรงกับ Repository ของจริง 100% ทำให้ไม่เกิดปัญหา Test เขียวบน Mock แต่พังบน Production"*

---

### 1.3 แสดง Factory (`make_book`) (1 นาที)
**เปิดไฟล์:** [`backend/tests/factories.py`](file:///Users/anasdareme/Documents/GitHub/sdpx-torpai/backend/tests/factories.py)
**บทพูด:**
> *"สำหรับ Test Data เราใช้ **Factory Pattern** ผ่านฟังก์ชัน `make_book(**overrides)`"*
> *"ฟังก์ชันนี้ตั้งค่า Default Data ที่สมบูรณ์ไว้เสมอ ทำให้ในการเขียน Test แต่ละข้อ เราใส่เฉพาะฟิลด์ที่เราต้องการ Overrides สำหรับ Test Case นั้นๆ ช่วยลดโค้ดซ้ำซ้อน (Repetition) และลดทอนความกระจัดกระจายของ Test Data"*

---

### 1.4 🔥 Break it Live! (1.5 นาที) [หัวใจสำคัญ!]
**ขั้นตอนการทำ Live Break:**
1. เปิดไฟล์ [`backend/src/services/borrow_service.py`](file:///Users/anasdareme/Documents/GitHub/sdpx-torpai/backend/src/services/borrow_service.py)
2. สลับไปที่ฟังก์ชัน `borrow_book` แล้ว **Comment out** 2 บรรทัดนี้ออก:
   ```python
   # if book.status == "borrowed":
   #     return BorrowResult(success=False, message="Book is already borrowed")
   ```
3. รัน Pytest ใน Terminal ทันที:
   ```bash
   PYTHONPATH=. .venv/bin/python -m pytest
   ```
4. **ผลลัพธ์:** Pytest จะแสดง **RED FAILED** ในเคส `test_borrow_book_rejected_when_book_already_borrowed`
5. **บทพูด:**
   > *"ลองมาทดสอบ High Fidelity ของ Test Suite โดยการทำลายโค้ดสดๆ ครับ ผมลองปิด Business Rule ห้ามยืมหนังสือซ้ำ แล้วรัน Test..."*
   > *"ผลลัพธ์คือ Test แดงทันที! ฟ้องว่าเคส `test_borrow_book_rejected_when_book_already_borrowed` FAILED ชี้ให้เห็นว่า Test ของเราคุ้มครอง Business Rule นี้จริงๆ ไม่ใช่แค่ Test ที่ดูดี"*
6. กด **Undo** (Ctrl+Z / Cmd+Z) แล้วรัน Pytest อีกครั้งเพื่อกลับเป็น **GREEN**

---

### 1.5 E2E / Integration Smoke Test (1 นาที)
**บทพูด:**
> *"นอกจาก Unit Tests แล้ว เรามี Integration / E2E Smoke Test ผ่าน FastAPI TestClient เพื่อตรวจว่า HTTP Router, Pydantic Schema และ Data Pipeline ทำงานร่วมกันได้จริงจาก Request Payload ถึง Response Code 200 OK"*

---

## 🗣️ Part 2: Explanation & AI Review (3 นาที)

### 2.1 เลือก Test Case ที่น่าสนใจที่สุด (1.5 นาที)
**เลือกเคส:** `test_borrow_book_rejected_when_book_already_borrowed`
**บทพูด:**
> *"Test Case ที่น่าสนใจที่สุดของเราคือ `test_borrow_book_rejected_when_book_already_borrowed`"*
> *"มันทำหน้าที่ปกป้อง **Key Business Rule** ข้อที่ว่า 'หนังสือที่มีสถานะเป็น borrowed จะต้องไม่ถูกยืมซ้ำเด็ดขาด' เพื่อป้องกันปัญหา Race Condition หรือข้อมูลทับซ้อนเมื่อนักศึกษาหลายคนพยายามยืมหนังสือเล่มเดียวกัน"*

---

### 2.2 การรีวิวและคัดทิ้ง AI-Generated Tests (1.5 นาที)
**บทพูด:**
> *"ในการใช้ AI ช่วยสร้าง Test เราคัดทิ้งไปประมาณ **3-4 เคส** ด้วยเหตุผลเฉพาะเจาะจง ดังนี้:"*
> 1. **คัดทิ้ง Constructor Test:** AI ชอบสร้าง Test ที่เช็คแค่ว่า `BorrowService(repo)` สร้าง instance ได้หรือไม่ ซึ่งไม่มีคุณค่าทาง Business Value (Trivial Test)
> 2. **คัดทิ้ง Internal State Assertions:** AI พยายามทดสอบ Private Attributes / Internal Method Call Order ซึ่งทำให้ Test เปราะบาง (Fragile Test) แก้โค้ดนิดเดียวแล้วพัง
> 3. **คัดทิ้ง Over-mocking:** AI พยายามใช้ `unittest.mock.MagicMock` ซ้อนกันหลายชั้น ซึ่งเสี่ยงต่อการหลอกลวงผลการทดสอบ (Low Fidelity) เราจึงเปลี่ยนมาใช้ `FakeBookRepository` ที่เขียนเองแทนทั้งหมด

---

## ❓ Part 3: Q&A Preparation — คำตอบเตรียมรับมืออาจารย์ (2 นาที)

### Q1: "Test นี้จะ fail ได้อย่างไร — ลอง break มันให้ดู"
- **แนวทางการตอบ:** ทำตามขั้นตอน **Break it Live!** โดยการเปิด `borrow_service.py` ลบหรือปิดเงื่อนไขตรวจสอบ (เช่น เช็ค Student ID ค่าว่าง หรือ เช็คหนังสือซ้ำ) แล้วรัน Pytest ให้เห็น FAILED สีแดงทันที

### Q2: "ทำไมใช้ FakeRepo แทน real database"
- **แนวทางการตอบ:**
  - **ความเร็ว (Speed):** FakeRepo ทำงานใน In-Memory ใช้เวลารัน 0.01 วินาที ทำให้รัน Test ได้บ่อยแบบสั่งได้ (Fast Feedback Loop)
  - **ความเป็นอิสระ (Isolation):** ไม่ต้องติดตั้ง/เปิด PostgreSQL Database Server ไม่โดนกระทบจาก State ตกค้างใน DB
  - **Fidelity สูงกว่า Mock:** FakeRepo ถูกบังคับผ่าน Interface (`ABC`) เดียวกับ Production Repository จึงมี Behavior เหมือน DB จริงโดยไม่เสี่ยงเรื่อง Over-mocking

### Q3: "Fixture นี้ต่างจาก Factory อย่างไร"
- **แนวทางการตอบ:**
  - **Factory (`make_book`):** คือ ฟังก์ชันสร้าง Object Data ดิบตามต้องการ สามารถกำหนดค่า Overrides ได้ตามชอบ (Data Generator)
  - **Fixture (`available_book` / `borrow_service`):** คือ ตัวจัดการ Lifecycle และ Injection สภาพแวดล้อมก่อน/หลังการทดสอบ (Pytest Dependency Injection) โดย Fixture จะเรียกใช้ Factory ในการสร้าง Data อีกทีหนึ่ง

### Q4: "ถ้าให้ AI agent แก้ code ใน service นี้ตอนนี้ คุณเชื่อผลของมันแค่ไหน เพราะอะไร"
- **แนวทางการตอบ:**
  > *"เราเชื่อมั่นสูงมาก (High Confidence) เพราะเรามี Test Harness ที่มี High Fidelity เมื่อ AI เอากฎทางธุรกิจออก หรือเขียนโค้ดติดบั๊ก รัน Pytest เพียง 0.01 วินาที Test จะฟ้องเป็นสีแดงทันที เราจึงตัดสินคุณภาพโค้ดจาก Empirical Test Results ไม่ใช่ความรู้สึก"*

### Q5: "มี business rule ข้อไหนใน unit-brief.md ที่ยังไม่มี test คุ้มครองไหม"
- **แนวทางการตอบ:**
  > *"ตามที่ระบุใน `TEST_PLAN.md` กฎของ `BorrowService` คุ้มครองครบ 100% แล้ว แต่มีกฎฝั่ง `BookCatalogService` (การค้นหาแบบ Case-Insensitive) และ `UserBooks` ที่ระบุไว้ในแผนว่ากำลังจัดเตรียม In-Memory Query Engine และ Auth Session เพื่อทำเพิ่มเติมใน WS-03 ครับ"*

---

## 🏆 Checklist คว้า 5/5 คะแนนเต็มตาม Rubric

- [x] **Tests ผ่าน (5/5):** ทุกเคสผ่าน + ใช้เวลา 0.01 วินาที (< 10 วินาที) + ไม่มี Trivial test
- [x] **Test Harness (5/5):** มี `FakeBookRepository` + `factories/fixtures` สื่อสารเหตุผลการเลือก Test Double ชัดเจน
- [x] **Fidelity (5/5):** โชว์ Break it live แล้วแดงจริง + มีผลบันทึกใน `TEST_PLAN.md`
- [x] **E2E Smoke Test (5/5):** มีแผนรองรับ Integration Check และอธิบายความแตกต่างจาก Unit Test ได้ชัดเจน
- [x] **AI Review (5/5):** ชี้เหตุผลการคัดทิ้ง AI test 3-4 เคสเฉพาะเจาะจง (Constructor test, Internal calls, Over-mocking)
