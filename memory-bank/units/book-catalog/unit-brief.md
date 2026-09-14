# Unit: Book Catalog

## Purpose
จัดการ ค้นหา กรองหมวดหมู่ และแสดงรายละเอียดของหนังสือในระบบห้องสมุด

## Responsibilities
- แสดงรายการหนังสือทั้งหมดในระบบพร้อมรายละเอียด (ชื่อเรื่อง, ผู้แต่ง, หมวดหมู่, ISBN)
- กรองรายการหนังสือตามหมวดหมู่ (เช่น วิทยาการคอมพิวเตอร์, วิศวกรรมศาสตร์, แพทยศาสตร์)
- ค้นหาหนังสือจากชื่อเรื่อง ผู้แต่ง หรือเลข ISBN
- แสดงสถานะความพร้อมของหนังสือ (`available` หรือ `borrowed`)

## NOT Responsible For
- บันทึกและประมวลผลการยืมหรือคืนหนังสือ (หน้าที่ของ `borrow-transaction`)
- จัดการประวัติและรายการหนังสือที่ระบุตัวตนของผู้ใช้ (หน้าที่ของ `user-books`)
- การรับ-ส่ง HTTP REST Request ระหว่างระบบ (หน้าที่ของ `api-gateway`)

## Dependencies
- Depends on: `api-gateway`
- Used by: `borrow-transaction`, `user-books`

## Key Business Rules
- การเพิ่มหนังสือทำได้เฉพาะ librarian และ ISBN ที่ normalize แล้วต้องไม่ซ้ำ
- การลบหนังสือทำได้เฉพาะ librarian และต้องไม่มีรายการยืมที่ยังไม่คืน
- การลบใช้ `deleted_at` เพื่อซ่อนจาก catalog โดยรักษาประวัติ loan และการเพิ่ม ISBN เดิมอีกครั้งจะ restore รายการเดิม
- หนังสือทุกเล่มต้องมี ISBN และชื่อเรื่องที่ถูกต้อง ไม่เป็นค่าว่าง
- สถานะของหนังสือต้องเป็นได้เพียง `available` หรือ `borrowed` เท่านั้น
- การกรอกข้อความค้นหาต้องทำการจับคู่แบบ Case-insensitive ทั้งชื่อเรื่อง ผู้แต่ง และ ISBN

## Key Stories
- [#10 Search](https://github.com/KNIGHTKRUBPOM/sdpx-torpai/issues/10), [#11 Filter](https://github.com/KNIGHTKRUBPOM/sdpx-torpai/issues/11), [#12 Add book](https://github.com/KNIGHTKRUBPOM/sdpx-torpai/issues/12), [#19 Delete book](https://github.com/KNIGHTKRUBPOM/sdpx-torpai/issues/19)

## Bolt Type
[x] Simple Construction — ถ้าเป็น UI, integration, utility
[ ] DDD Construction — ถ้า domain logic ซับซ้อน
