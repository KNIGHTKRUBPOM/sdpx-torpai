# PairEval

PairEval เป็นระบบประเมินผลงานนักศึกษาแบบ pairwise comparison สำหรับรายวิชาในมหาวิทยาลัย
ผู้ประเมินเลือกจากตัวเลือกบังคับ 6 ระดับว่าผลงานฝั่งใดดีกว่า ระบบใช้เฉพาะคำตอบที่กดส่งแล้ว
คำนวณคะแนนที่อธิบายและทำซ้ำได้ โดยอาจารย์ยังเป็นผู้ตรวจและตัดสินผลสุดท้าย

## สถานะปัจจุบัน

Local M4 ทำงานครบวงจรด้วย React, FastAPI และ PostgreSQL:

- Demo Login แยก Instructor/Student และตรวจ role/classroom scope ฝั่ง server
- Instructor สร้าง Classroom, Import roster CSV แบบ atomic, สร้าง Draft Assignment,
  ตรวจ feasibility และ Publish เพื่อ generate/persist pairs
- Student ทำ Group และ Individual Evaluation แยกหน้า/แยก deadline, autosave draft,
  refresh แล้วทำต่อได้ และ submit/re-submit เป็น immutable revision
- Pairing deterministic และ Scoring ใช้ `Decimal` จาก domain services ที่แยกจาก HTTP/DB
- Individual pairing ใช้ complete enumeration ภายในกลุ่มและลด workload แบบ balanced เมื่อเกินเพดาน
- คะแนนรวม Group + Individual ใช้ band `0.60–1.00` และ participation threshold `0.90`
- Instructor เปิด Group/Individual/Coverage/Quality reports, override/exclude พร้อมเหตุผล,
  ตรวจ audit, จัดการ appeals และ Finalize เป็น immutable score snapshot ได้
- Quality report มี QS-01 ถึง QS-07 รวม Kendall's W และไม่มีการลดน้ำหนักอัตโนมัติ
- Export CSV UTF-8 BOM, raw pseudonymous CSV และ XLSX 4 sheets พร้อม metadata
- Privacy notice ครั้งแรก, data-subject export, retention anonymization และ k-anonymity
- Notification inbox แจ้ง Publish/Finalize และ worker เตือน 48 ชั่วโมง/auto-finalize หลัง 14 วัน
- PostgreSQL เก็บ users, memberships, groups, assignments, criteria, pairs, comparisons,
  submission revisions และ audit records
- Startup migration เพิ่ม schema แบบ additive, รักษา volume เดิม และบังคับ audit append-only ที่ DB
- Docker Compose เปิด Frontend + Backend + Database + maintenance worker ได้ด้วยคำสั่งเดียว
- CI รัน backend/frontend/E2E/WCAG และมี scheduled/manual k6 gate สำหรับ 200 concurrent users

Local/Docker ใช้ Demo Login โดยตั้งใจและห้ามนำโหมดนี้ขึ้น production สิ่งที่ยังต้องใช้อำนาจหรือระบบภายนอกคือ
Google OIDC credentials/allowed domain, HTTPS infrastructure, staging/pilot จริง, monitoring alert,
backup restore drill และ manual screen-reader review

## เปิดระบบด้วย Docker

ต้องมี Docker Desktop และ Docker Compose v2 จากนั้นรันที่ root ของโปรเจกต์:

```powershell
cd E:\SPDX-torpai
docker compose up --build -d
docker compose ps
```

รอจน `db`, `backend` และ `frontend` ขึ้นสถานะ healthy (`maintenance` จะทำงานต่อเนื่อง) แล้วเปิด:

- Web application: http://localhost:8080
- API documentation: http://localhost:8000/docs
- API health: http://localhost:8080/health
- PostgreSQL: `localhost:5432`

ดู log:

```powershell
docker compose logs -f backend frontend
```

หยุดระบบโดยเก็บข้อมูลไว้:

```powershell
docker compose down
```

ข้อมูลอยู่ใน named volume `paireval_postgres_data` จึงยังอยู่หลังเปิดใหม่ หากต้องการล้างข้อมูล
ทั้งหมดจริง ๆ จึงค่อยใช้ `docker compose down -v` ซึ่งกู้คืนข้อมูลใน volume ไม่ได้

## วิธี Demo

### Instructor

1. เปิดเว็บและกดบัญชี Instructor
2. สร้าง Classroom หรือเลือกห้อง Demo ที่มีอยู่
3. Import roster CSV โดยใช้รูปแบบจาก `docs/roster-example.csv`
4. สร้าง Assignment, คะแนนเต็ม, deadline และ criteria ของ Group/Individual
5. กดตรวจ Feasibility และ Publish
6. ระบบ generate pair assignments ทั้งสองฝั่งและบันทึกลง PostgreSQLก่อนนักศึกษาเปิดหน้า
7. หลังมี submission ให้เปิดรายงาน ดาวน์โหลด CSV/XLSX หรือเปิด “กำกับคะแนน / Audit”
8. หลัง deadline Owner กด Finalize; นักศึกษาดูคะแนนสิ้นสุดและยื่นคำร้องได้ภายใน 7 วัน

คอลัมน์ CSV ที่รองรับ:

```text
email,group_name,student_id,display_name,artifact_url
```

`email` กับ `group_name` บังคับ และทุกกลุ่มต้องมีอย่างน้อย 2 คน ก่อน Publish ต้องมีอย่างน้อย
3 กลุ่มและทุกกลุ่มต้องมี `artifact_url` หากมีเพียง 2 กลุ่ม ระบบจะสร้างคู่ให้ผู้สอนประเมินแทน
เพื่อไม่ละเมิดกฎห้ามนักศึกษาประเมินกลุ่มตัวเอง หากแถวใดผิด ระบบ reject ทั้งไฟล์โดยไม่บันทึกบางส่วน

### Student

1. ออกจากระบบแล้วเลือกนักศึกษาตัวอย่าง เช่น `student-09`
2. เปิด Group หรือ Individual Evaluation และเลือกคำตอบ 1–6 ของทุกคู่
3. สังเกตสถานะ “บันทึกแล้ว” จาก Backend
4. Refresh หน้าแล้วเปิด Assignment อีกครั้ง คำตอบเดิมยังอยู่
5. กดส่งแยกแต่ละฝั่ง ระบบ snapshot revision และใช้ submission ล่าสุดคำนวณ
6. เปิดคะแนนชั่วคราวเพื่อดู Group component, Individual component, participation และ multiplier
7. Individual score ที่มีผู้ประเมินน้อยกว่า `min_comparisons` จะแสดง “ข้อมูลยังไม่พอ”
8. รับ notification ในหน้า dashboard และยื่นอุทธรณ์ได้หลัง Finalize

ข้อมูล Demo เริ่มต้นมี baseline comparisons เพื่อให้ `student-09` สามารถเห็น score preview ได้
หลังทำและส่งงานของตัวเอง

## รันแบบไม่ใช้ Docker

Backend ใช้ SQLite เป็นค่าเริ่มต้นสำหรับ local development:

```powershell
python -m pip install -r requirements.txt
cd backend
python -m uvicorn main:app --reload
```

อีก Terminal:

```powershell
cd frontend
npm ci
npm run dev
```

เปิด http://localhost:5173 โดย Vite จะ proxy `/api` ไป Backend ที่ port 8000

## ตรวจสอบคุณภาพ

Backend พร้อม ephemeral PostgreSQL:

```powershell
docker compose -f compose.test.yaml run --build --rm backend-test
```

Frontend:

```powershell
cd frontend
npm test
npm run lint
npm run build
```

E2E กับ Docker stack ที่กำลังรัน:

```powershell
cd frontend
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:8080'
npm run test:e2e
```

Load test 200 concurrent users (ต้องมี `k6`; 200 VU เปิดงานพร้อมกันและมี deterministic think time
3–8 วินาทีก่อน autosave เพื่อจำลองการอ่านคู่จริง):

```powershell
k6 run performance/paireval.js
```

ผล baseline ล่าสุดและวิธีตีความอยู่ที่ `docs/performance-report.md`; raw summary อยู่ที่
`performance/k6-summary.json`

คู่มือ backup/restore, alerts, retention และ incident response อยู่ที่ `docs/operations.md`

## เอกสารหลัก

- Product intent: `memory-bank/intent.md`
- Backlog: `docs/backlog.md`
- Architecture: `docs/architecture.md`
- ERD: `docs/erd.md`
- API contract: `docs/openapi.yaml`
- Test plan: `TEST_PLAN.md`
- WS-01 ถึง WS-03 notes: `docs/PROJECT_NOTES_WS01_WS03.md`
- Workshop/product gap: `docs/WS04_WS08_AND_PRODUCT_GAP.md`
- Operations runbook: `docs/operations.md`
