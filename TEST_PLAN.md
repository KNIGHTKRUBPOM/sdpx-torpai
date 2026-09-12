# Test Plan

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

## กฎที่ยังไม่มี test (ยอมรับไว้ชั่วคราว)

- **[ระบบกรองค้นหาแบบ Case-Insensitive ใน BookCatalogService]** — อยู่ระหว่างจัดเตรียม In-Memory Query Engine ใน WS-03
- **[ระบบดึงรายการหนังสือของผู้ใช้ (UserBooksService)]** — จะทำ Unit Test เพิ่มเติมเมื่อเชื่อมต่อ User Session / Auth Service ใน WS-03
- **[HTTP Status Code & Pydantic Schema Validation ใน APIGateway]** — จะทำ Integration Test ร่วมกับ FastAPI TestClient ใน WS-04
