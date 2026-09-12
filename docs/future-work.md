# UniLib Future Work

เอกสารนี้รวบรวมงานต่อยอดหลัง WS1–5 โดยแยกสิ่งที่ควรทำก่อนใช้งานจริงออกจากฟีเจอร์เสริม เพื่อไม่ให้ scope ปัจจุบันสับสนกับ roadmap

## P0 — ก่อนเปิดใช้จริง

- เชื่อม Vercel, Render และ PostgreSQL จริง พร้อมตั้ง secrets แยก development/staging/production
- เพิ่ม GitHub Actions ให้รัน backend, frontend, lint, build และ Docker test compose ทุก Pull Request
- เพิ่มระบบ backup/restore, migration rollback rehearsal และแจ้งเตือนเมื่อฐานข้อมูลหรือ API ไม่พร้อมใช้งาน
- เพิ่ม structured logging, request ID, error monitoring และ dashboard สำหรับ latency/error rate
- เปลี่ยน demo credentials ทั้งหมด และกำหนดขั้นตอนหมุน JWT secret โดยไม่ทำให้ระบบหยุดนาน

## P1 — Identity และความปลอดภัย

- ตรวจ Student ID กับฐานทะเบียนมหาวิทยาลัย แทนการรับรหัสที่ผู้สมัครกรอกเอง
- เพิ่ม email verification, ลืมรหัสผ่าน, เปลี่ยนรหัสผ่าน และปิด session ทุกอุปกรณ์
- เพิ่ม rate limit, account lockout, audit log และบันทึกการกระทำของบรรณารักษ์
- รองรับ Single Sign-On ของมหาวิทยาลัยและสิทธิ์แบบละเอียดมากกว่า `student`/`librarian`

## P1 — งานห้องสมุด

- แยก `book title/ISBN` ออกจาก `physical copy/barcode` เพื่อรองรับหนังสือ ISBN เดียวกันหลายเล่ม
- เพิ่มสแกนบาร์โค้ด, จองคิว, ต่ออายุ, แจ้งเตือนใกล้ครบกำหนด และประวัติการยืมย้อนหลัง
- เพิ่มนโยบายหนังสือสูญหาย ชำรุด เกินกำหนด และค่าปรับที่ตั้งค่าได้
- เพิ่มหน้า inventory สำหรับนำเข้า CSV, แก้ไข, ถอนหนังสือ และตรวจนับสต็อก

## P2 — Search และประสบการณ์ใช้งาน

- เพิ่ม pagination, sort, Thai full-text search, typo tolerance และค้นหาตาม tag/ปีพิมพ์
- เพิ่มรูปปก รายละเอียดสำนักพิมพ์ ชั้นวาง และจำนวน copy ที่พร้อมยืม
- เพิ่ม accessibility audit, responsive test และ performance budget สำหรับอุปกรณ์ช้า
- เพิ่ม notification ทาง email/LINE ตามความยินยอมของผู้ใช้

## P2 — การทดสอบที่ควรเพิ่ม

- PostgreSQL concurrency test ที่ยิงยืมหนังสือเล่มเดียวพร้อมกันหลาย request และยืนยันว่าผ่านเพียงหนึ่งรายการ
- Contract test เปรียบเทียบ FastAPI schema กับ `docs/openapi.yaml`
- Migration test จากฐานข้อมูลเวอร์ชันก่อนหน้า พร้อมทดสอบ backup/restore
- Security tests สำหรับ brute force, JWT rotation, CORS และ test-only endpoint ใน production
- เพิ่ม mutation testing เพื่อยืนยันว่า test ล้มเมื่อ business rule สำคัญถูกเปลี่ยน
- เพิ่ม E2E สำหรับ empty/error/loading state, session expiry และ mobile viewport

## Definition of Done สำหรับฟีเจอร์อนาคต

ฟีเจอร์หนึ่งถือว่าเสร็จเมื่อมี acceptance criteria, migration ที่ย้อนกลับได้, unit/integration test, E2E เฉพาะ critical journey, เอกสาร OpenAPI, monitoring และหลักฐานว่าไม่ทำให้ flow สมัคร–ยืม–คืนเดิมเสีย

