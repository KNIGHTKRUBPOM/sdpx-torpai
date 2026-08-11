# Intent: Campus Book Borrowing Service

## Intent Statement
Enable university students and staff to search, borrow, and return library books online, reducing physical queue times, manual paperwork, and book return conflicts.

## Business Context
- **Problem:** ระบบการยืม-คืนหนังสือในห้องสมุดมหาวิทยาลัยแบบเดิมยังมีความล่าช้าในการค้นหาเล่มหนังสือ การกรอกเอกสารยืมด้วยมือ และขาดระบบตรวจสอบสถานะความพร้อมของหนังสือแบบเรียลไทม์
- **Users:** นิสิต/นักศึกษา (Students), อาจารย์และบุคลากรทางการศึกษา (Faculty & Staff), เจ้าหน้าที่ห้องสมุด (Librarians)
- **Value:** เพิ่มความสะดวกและรวดเร็วในการยืม-คืนหนังสือ สามารถค้นหา ค้นคืน และตรวจสอบสถานะหนังสือได้ทันที ลดขั้นตอนงานเอกสาร และลดปัญหาการยืมหนังสือซ้ำซ้อน

## Success Criteria
- [ ] ผู้ใช้สามารถค้นหาหนังสือ กรองตามหมวดหมู่ และเช็คสถานะการยืม (Available/Borrowed) ได้แบบเรียลไทม์
- [ ] ผู้ใช้สามารถทำรายการยืมและคืนหนังสือผ่านระบบออนไลน์ได้สำเร็จโดยระบุรหัสนักศึกษา และ ISBN
- [ ] ระบบ Backend (FastAPI) สามารถประมวลผลคำขอยืม-คืน และส่งตอบกลับ REST API ภายในระยะเวลา < 500ms

## Decisions Already Made
- **Frontend Stack:** React 19 + TypeScript + Vite + Tailwind CSS (v4) + Oxlint
- **Backend Stack:** FastAPI (Python 3.10+) + Uvicorn + Pydantic
- **Database:** PostgreSQL (วางแผนใช้เป็นฐานข้อมูลหลักสำหรับจัดเก็บข้อมูลหนังสือ สมาชิก และประวัติการยืม-คืน)
- **Architecture:** Decoupled Full-stack Architecture (Frontend แยกกับ Backend สื่อสารผ่าน REST APIs)
- **Agent Guidelines:** ปฏิบัติตามมาตรฐานใน `Agent.md` และ `memory-bank/standards/tech-stack.md`

## Out of Scope
- ระบบชำระเงินค่าปรับหนังสือเกินกำหนดผ่าน Payment Gateway (ใช้เพียงการคำนวณและแสดงยอดค่าปรับในระบบ)
- ระบบสแกนบาร์โค้ดด้วยฮาร์ดแวร์ Physical Barcode Scanner ในเฟสแรก (ใช้วิธีกรอกรหัส ISBN/รหัสนักศึกษาผ่าน UI)
- ระบบส่งอีเมลแจ้งเตือนภายนอก (Third-party Email/SMS Notification System)

## Status
In Progress — WS-02 ยึดข้อมูลตาม agent.md
