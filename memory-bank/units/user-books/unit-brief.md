# Unit: User Books

## Purpose
จัดการและแสดงรายการหนังสือที่ผู้ใช้แต่ละคนกำลังยืมอยู่ พร้อมแจ้งเตือนวันกำหนดส่งคืน

## Responsibilities
- แสดงรายการหนังสือทั้งหมดที่ผูกกับรหัสนักศึกษาของผู้ใช้ปัจจุบัน
- แสดงวันกำหนดส่งคืนหนังสือ (Due Date) ของแต่ละเล่ม
- แสดงคำเตือนหรือการแจ้งเตือนกรณีหนังสือใกล้ถึงกำหนดส่งคืนหรือเกินกำหนด

## NOT Responsible For
- การประมวลผลเปลี่ยนสถานะการยืม-คืนหนังสือ (หน้าที่ของ `borrow-transaction`)
- ค้นหาและกรองหนังสือจากแค็ตตาล็อกทั้งหมด (หน้าที่ของ `book-catalog`)

## Dependencies
- Depends on: `book-catalog`, `borrow-transaction`, `api-gateway`
- Used by: User Dashboard / UI Navigation

## Key Business Rules
- แสดงเฉพาะหนังสือที่มีสถานะ `borrowed` และตรงกับรหัสนักศึกษาที่ค้นหา/ระบุเท่านั้น
- รายการหนังสือของผู้ใช้ต้องแสดงวันกำหนดส่งคืน (Due Date) อย่างชัดเจนเสมอ

## Key Stories
- N/A (Will link to GitHub Issues when created)

## Bolt Type
[ ] DDD Construction — ถ้า domain logic ซับซ้อน
[x] Simple Construction — ถ้าเป็น UI, integration, utility
