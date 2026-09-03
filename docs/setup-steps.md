# Environment Setup — Docker M1

## ก่อนใช้ Docker

การเปิดระบบแบบแยก service ต้องติดตั้ง Python/Node dependencies, เปิด Backend, เปิด Frontend
และเตรียมฐานข้อมูลด้วยตนเอง ทำให้ environment แต่ละเครื่องต่างกันและข้อมูล Demo เดิมเป็น in-memory

## หลังใช้ Docker

คำสั่งเดียวสร้างและเปิด Frontend, Backend และ PostgreSQL:

```powershell
docker compose up --build -d
```

Compose รอ database health check ก่อนเปิด Backend และรอ Backend health check ก่อนเปิด Frontend
จึงลดปัญหา service เริ่มไม่ทันกัน ข้อมูล application อยู่ใน named volume และ test database ใช้
`tmpfs` เพื่อให้ไม่มี state รั่วข้าม production data

## Services

- `frontend`: React production build บน unprivileged Nginx, port 8080
- `backend`: FastAPI บน non-root Python user, port 8000
- `db`: PostgreSQL 17, port 5432 และ persistent named volume

## Verification

```powershell
docker compose ps
Invoke-RestMethod http://localhost:8080/health
```

ผลที่คาดหวังคือทั้งสาม service healthy และ health response เป็น
`{"status":"ok","database":"connected"}`
