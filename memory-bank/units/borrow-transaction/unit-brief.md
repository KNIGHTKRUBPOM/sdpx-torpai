# Unit: Borrow Transaction

## Purpose
ประมวลผลการยืมและคืนหนังสือ คำนวณวันกำหนดส่ง และปรับปรุงสถานะความพร้อมของหนังสือ

## Responsibilities
- รับและตรวจสอบความถูกต้องของรหัสนักศึกษา (Student ID) และรหัส ISBN ของหนังสือ
- ตรวจสอบสิทธิ์และสถานะหนังสือว่าอยู่ในสถานะ `available` ก่อนทำรายการยืม
- ประมวลผลทำรายการยืมหนังสือ และกำหนดวันส่งคืน (Default: 14 วันนับจากวันที่ยืม)
- ประมวลผลทำรายการคืนหนังสือ และเปลี่ยนสถานะกลับเป็น `available`

## NOT Responsible For
- แสดงผลการค้นหาและรายละเอียดแค็ตตาล็อกหนังสือทั้งหมด (หน้าที่ของ `book-catalog`)
- จัดเก็บและแสดงผลหน้ารวมหนังสือของผู้ใช้แต่ละคน (หน้าที่ของ `user-books`)

## Dependencies
- Depends on: `book-catalog`, `api-gateway`
- Used by: `user-books`

## Key Business Rules
- หนังสือที่จะทำการยืมได้ ต้องมีสถานะเป็น `available` เท่านั้น หากเป็น `borrowed` จะไม่สามารถยืมซ้ำได้
- การยืมหนังสือสำเร็จต้องสร้างวันกำหนดส่งคืน (Due Date) เสมอ
- การคืนหนังสือสำเร็จต้องเปลี่ยนสถานะของหนังสือกลับเป็น `available` และลบวันกำหนดส่งคืนออก

## Key Stories
- N/A (Will link to GitHub Issues when created)

## Bolt Type
[x] DDD Construction — ถ้า domain logic ซับซ้อน
[ ] Simple Construction — ถ้าเป็น UI, integration, utility
