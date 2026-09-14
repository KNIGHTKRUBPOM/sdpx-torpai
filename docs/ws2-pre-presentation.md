# WS2 Pre-Presentation Runbook (10 นาที)

คู่มืออาจารย์กำหนดให้ demo หน้าจอโดยไม่ต้องใช้ slide เอกสารนี้จึงจัดลำดับหน้าต่างและบทพูดให้เปิดตามได้ทันที

## เตรียมก่อนเริ่ม

เปิดไว้ 5 หน้าต่างตามลำดับ:

1. GitHub Issues ของ repo
2. `docs/requirements.md`
3. `docs/architecture.md`
4. `docs/erd.md`
5. Terminal ที่ root ของ repo และ Swagger UI ที่ `http://localhost:8000/docs`

รันระบบและตรวจ contract ก่อนถึงเวลานำเสนอ:

```bash
docker compose up --build
npx @redocly/cli lint docs/openapi.yaml
```

Redocly ต้องแสดง `Your API description is valid` ปัจจุบันมี warning เดียวเพราะ health endpoint ไม่มี 4xx response ซึ่งเป็น endpoint สาธารณะที่ไม่มี request payload

## นาที 0:00–0:40 — ปัญหาและผู้ใช้

> UniLib ลดเวลาค้นหาและขั้นตอนยืมคืนหนังสือ ผู้ใช้หลักมีนักศึกษากับบรรณารักษ์ นักศึกษาสมัคร ค้นหา ยืม คืน และดูกำหนดคืน ส่วนบรรณารักษ์เพิ่ม ลบ และจัดการรายการยืมได้

## นาที 0:40–2:10 — Backlog และ Story

เปิด GitHub Issues แล้วชี้ให้เห็นว่ามีมากกว่า 8 stories จากนั้นเปิด US-10

> Story ที่จะใช้ trace วันนี้คือ บรรณารักษ์ต้องการลบหนังสือที่ไม่ใช้แล้ว เพื่อให้ catalog แสดงเฉพาะหนังสือที่ห้องสมุดดูแลอยู่

อ่าน AC สองกรณี:

- หนังสือว่าง ลบสำเร็จและหายจาก catalog
- หนังสือกำลังถูกยืม ระบบตอบ `409` และไม่ลบ

## นาที 2:10–4:00 — Requirement diagrams

เปิด use-case diagram ใน `docs/requirements.md`

> ฝั่งนักศึกษาใช้ catalog และ loan flow ส่วนการเปลี่ยนข้อมูลคลังเป็นหน้าที่บรรณารักษ์ จึงไม่เปิด delete ให้ student

เปิด component diagram ใน `docs/architecture.md`

> Browser รัน React และส่ง REST/JSON พร้อม JWT ไป FastAPI Router จากนั้น Router ตรวจ role แล้วเรียก service กฎธุรกิจอยู่ใน service ส่วน SQLAlchemy ติดต่อ PostgreSQL

เปิด ERD

> User หนึ่งคนมี loan ได้หลายรายการ Book หนึ่งรายการมีประวัติ loan ได้หลายครั้ง แต่มี active loan ได้ครั้งเดียว `deleted_at` ทำให้ลบจาก catalog โดยยังรักษา loan เก่า

## นาที 4:00–5:30 — Demo ฟีเจอร์ลบ

1. Login ด้วยบัญชี librarian
2. เปิด “จัดการหนังสือ” และเพิ่มหนังสือสำหรับ demo
3. ชี้รายการใหม่ในตารางจัดการหนังสือ
4. กด “ลบ” และยืนยัน
5. เปิด catalog เพื่อแสดงว่าหนังสือหายไปแล้ว

พูดระหว่าง demo:

> UI ขอคำยืนยันก่อนส่ง `DELETE /api/books/{book_id}` ถ้าสำเร็จ API ตอบ 204 และหน้าเว็บโหลดรายการใหม่ หนังสือไม่ได้ถูกลบจากฐานข้อมูลจริง แต่ถูก archive เพื่อรักษาประวัติ

## นาที 5:30–7:00 — Validate OpenAPI

รัน:

```bash
npx @redocly/cli lint docs/openapi.yaml
```

เปิด `DELETE /api/books/{book_id}` ใน Swagger UI แล้วชี้:

- Bearer authentication
- Path parameter `book_id`
- `204` เมื่อลบสำเร็จ
- `401`, `403`, `404`, `409` สำหรับ error cases
- `x-user-story: US-10` สำหรับ trace กลับ requirement

## นาที 7:00–8:20 — Defend การออกแบบ

> ใช้ DELETE เพราะ client ต้องการนำ resource ออกจาก catalog และใช้ book ID เพื่อระบุ resource เดียว ตอบ 204 เพราะไม่มี response body ที่ frontend ต้องใช้ กรณีมี active loan ใช้ 409 เพราะ request ถูกต้องและมีสิทธิ์ แต่ขัดกับสถานะปัจจุบันของหนังสือ

Trade-off:

> Soft delete เพิ่มเงื่อนไขใน query และทำให้ต้องคิดเรื่อง restore ISBN เดิม แต่แลกกับการรักษาประวัติ loan และหลีกเลี่ยง foreign-key error ระบบจึง restore record เดิมเมื่อเพิ่ม ISBN ที่เคยลบ

## นาที 8:20–9:00 — สิ่งที่ AI เสนอแล้วไม่รับ

> เราไม่รับ hard delete เพราะมันทำให้ประวัติการยืมหายหรือชน foreign key และไม่รับการให้ student ลบหนังสือ เพราะเกินขอบเขตสิทธิ์ของผู้ใช้

## นาที 9:00–10:00 — คำถามที่น่าจะถูกถาม

**ถ้าไม่ Login แล้วลบ?** ได้ `401 AUTH_REQUIRED`

**ถ้า Login เป็น student?** ได้ `403 LIBRARIAN_REQUIRED`

**ถ้าลบตอนมีคนยืม?** ได้ `409 BOOK_HAS_ACTIVE_LOAN`

**ทำไมไม่ตอบ 400?** Payload ไม่ได้ผิด แต่สถานะ resource ขัดกับคำสั่ง จึงใช้ 409

**AC นี้กลายเป็น test ไหน?** Service test ตรวจ archive และ active-loan conflict, API test ตรวจ role/204 และ Playwright ตรวจการเพิ่มแล้วลบจากหน้าเว็บ

**ความสัมพันธ์ N:M อยู่ตรงไหน?** User กับ Book มีความสัมพันธ์หลายต่อหลายข้ามเวลา โดยใช้ Loan เป็น associative entity ที่เก็บวันยืม กำหนดคืน และวันคืน

## ประโยคปิด

> Spec Loop ของฟีเจอร์นี้ต่อกันครบจาก US-10 ไปยัง AC, diagrams, OpenAPI, implementation และ automated tests จึงตรวจได้ทั้งก่อนเขียนโค้ดและหลังระบบทำงาน
