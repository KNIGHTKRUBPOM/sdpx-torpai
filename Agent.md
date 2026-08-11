# 🤖 Agent Guidelines & Project Context (`Agent.md`)

เอกสารนี้รวบรวมบริบทของโปรเจกต์ โครงสร้างซอร์สโค้ด คำสั่งสำหรับการพัฒนา และแนวทางปฏิบัติสำหรับ AI Agent ในการทำงานกับโปรเจกต์ **SDPX - Torpai (ต่อไป)**

---

## 📌 1. ภาพรวมโปรเจกต์ (Project Overview)

- **ชื่อโปรเจกต์:** SDPX - Torpai (ต่อไป) 🚀
- **ทีมพัฒนา:** ทีมต่อไป
- **เป้าหมาย:** เว็บแอปพลิเคชัน Full-stack สำหรับ **ระบบยืม-คืนหนังสือ (Book Borrowing & Returning System)**
- **ลักษณะแอปพลิเคชัน:** บริหารจัดการหนังสือ ค้นหา ค้นคืน ยืมหนังสือ คืนหนังสือ และจัดการข้อมูลผู้ใช้งาน

---

## 🛠️ 2. เทคโนโลยีที่ใช้ (Tech Stack)

### **Frontend**
- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (v4)
- **Linter:** Oxlint

### **Backend**
- **Framework:** FastAPI
- **Language:** Python (v3.10+)
- **ASGI Server:** Uvicorn
- **Validation:** Pydantic

### **Database & Infrastructure (Planned)**
- **Database:** PostgreSQL
- **Deployment Platform:** Vercel / Render

### **Testing & Quality**
- **Frontend / Root Test Runner:** Vitest
- **Backend Test Runner:** Pytest

---

## 📁 3. โครงสร้างโปรเจกต์ (Project Architecture)

```text
sdpx-torpai/
├── backend/                  # FastAPI Backend Service
│   ├── .venv/                # Python Virtual Environment
│   └── main.py               # จุดเริ่มต้น FastAPI Server (REST APIs)
├── frontend/                 # React + TypeScript Frontend Application
│   ├── src/                  # Source code (App.tsx, Components, Styles)
│   ├── .oxlintrc.json        # Oxlint configuration
│   ├── vite.config.ts        # Vite configuration
│   └── package.json          # Frontend dependencies & scripts
├── docs/                     # เอกสารสถาปัตยกรรมและไดอะแกรมของระบบ
│   └── component-diagram.md  # Component Diagram (Mermaid format)
├── memory-bank/              # เอกสารและมาตรฐานการพัฒนาระบบ
│   ├── standards/            # ข้อกำหนดและมาตรฐานทางเทคนิค (tech-stack.md)
│   └── units/                # รายละเอียดโมดูล/ฟีเจอร์
├── requirements.txt          # Python packages สำหรับ Backend
├── package.json              # Root dependencies (Vitest devDependencies)
├── Agent.md                  # คำแนะนำบริบทและการทำงานสำหรับ AI Agent
└── README.md                 # เอกสารอธิบายโปรเจกต์ภาพรวม
```

---

## 🚀 4. คำสั่งสำคัญในการพัฒนา (Development Commands)

### **Backend (FastAPI)**
```bash
# เข้าไปยังโฟลเดอร์ backend
cd backend

# เปิดใช้งาน Virtual Environment
# macOS/Linux:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# ติดตั้ง Dependencies
pip install -r ../requirements.txt

# รัน Backend Development Server (Port 8000)
uvicorn main:app --reload
```
- **API Base URL:** `http://localhost:8000`
- **Swagger Docs:** `http://localhost:8000/docs`
- **ReDoc Docs:** `http://localhost:8000/redoc`

### **Frontend (React + Vite)**
```bash
# เข้าไปยังโฟลเดอร์ frontend
cd frontend

# ติดตั้ง Node Dependencies
npm install

# รัน Frontend Development Server (Port 5173)
npm run dev

# ตรวจสอบ Type & Build สำหรับ Production
npm run build

# ตรวจสอบโค้ดด้วย Oxlint
npm run lint

# พรีวิวผลลัพธ์การ Build
npm run preview
```

### **Testing**
```bash
# รัน Frontend/Root Tests ด้วย Vitest
npx vitest

# รัน Backend Tests ด้วย Pytest (ใน backend directory)
pytest
```

---

## 📋 5. แนวทางปฏิบัติสำหรับ AI Agent (Agent Rules & Standards)

1. **การตรวจสอบก่อนเริ่มงาน (Context Awareness)**
   - อ่านและปฏิบัติตามมาตรฐานใน `memory-bank/standards/tech-stack.md`
   - ตรวจสอบโครงสร้างไฟล์ที่มีอยู่ก่อนสร้างไฟล์ใหม่เสมอ

2. **นโยบายการเขียนและปรับปรุงโค้ด (Coding & Review Policy)**
   - ทุกโค้ดที่สร้างขึ้น (AI-generated code) ต้องสามารถอ่าน เข้าใจง่าย และอธิบายเหตุผลได้ก่อนทำการ Commit
   - ฝั่ง Frontend ต้องใช้ TypeScript strict types และใช้ Tailwind CSS สำหรับ Styling
   - ฝั่ง Backend ต้องใช้ Pydantic ในการทำ Data Validation และปฏิบัติตาม RESTful API Standards

3. **ขั้นตอนการยืนยันความถูกต้อง (Verification Guidelines)**
   - ห้ามยืนยันว่างานเสร็จสิ้นหากยังไม่ได้รันคำสั่งตรวจสอบ (เช่น `npm run build`, `npm run lint` หรือ `npx vitest` / `pytest`)
   - หากมีข้อผิดพลาด (Errors) ต้องตรวจสอบ Log ทั้งหมดก่อนหาสาเหตุและแก้ไข ห้ามใช้ try/except หรือ fallback ปลอมเพื่อปิดบังข้อผิดพลาด

4. **การอัปเดตความรู้และเอกสาร (Memory Bank Updates)**
   - เมื่อมีการเพิ่ม Library, ปรับโครงสร้าง หรือกำหนดแนวทางใหม่ ให้ปรับปรุงเอกสารใน `memory-bank/` และ `README.md` / `Agent.md` ให้เป็นปัจจุบันเสมอ

---
