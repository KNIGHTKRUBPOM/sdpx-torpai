# SDPX - Torpai (ต่อไป) 🚀

โปรเจกต์เว็บแอปพลิเคชัน Full-stack พัฒนาโดยทีม **ต่อไป** 

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Linter:** Oxlint

### **Backend**
- **Framework:** FastAPI
- **Language:** Python
- **Server:** Uvicorn
- **Validation:** Pydantic

### **Database (Planned)**
- PostgreSQL

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
sdpx-torpai/
├── backend/                  # FastAPI Backend Service
│   └── main.py               # จุดเริ่มต้นระบบ Backend API
├── frontend/                 # React + TypeScript Frontend Application
│   ├── src/                  # ซอร์สโค้ดฝั่ง Frontend
│   └── package.json          # Dependency และ Scripts สำหรับ Frontend
├── memory-bank/              # เอกสารและมาตรฐานการพัฒนา (Tech Stack & Standards)
├── requirements.txt          # Python dependencies สำหรับ Backend
└── README.md                 # เอกสารอธิบายโปรเจกต์
```

---

## 🚀 การติดตั้งและการใช้งาน (Getting Started)

### **ข้อกำหนดเบื้องต้น (Prerequisites)**
- Node.js (v18 ขึ้นไปแนะนำ)
- Python (v3.10 ขึ้นไปแนะนำ)

---

### 1. 🐍 การตั้งค่า Backend (FastAPI)

1. เข้าไปยังไดเรกทอรี `backend`:
   ```bash
   cd backend
   ```

2. สร้าง Virtual Environment:
   ```bash
   python -m venv .venv
   ```

3. เปิดใช้งาน Virtual Environment:
   - **macOS / Linux:**
     ```bash
     source .venv/bin/activate
     ```
   - **Windows:**
     ```bash
     .venv\Scripts\activate
     ```

4. ติดตั้ง Package ต่างๆ จาก `requirements.txt`:
   ```bash
   pip install -r ../requirements.txt
   ```

5. เริ่มต้นรันเซิร์ฟเวอร์ Backend:
   ```bash
   uvicorn main:app --reload
   ```

6. เข้าใช้งาน API และ Interactive Documentation:
   - API Endpoint: `http://localhost:8000`
   - Swagger UI Documentation: `http://localhost:8000/docs`
   - ReDoc Documentation: `http://localhost:8000/redoc`

---

### 2. ⚛️ การตั้งค่า Frontend (React + Vite)

1. เข้าไปยังไดเรกทอรี `frontend`:
   ```bash
   cd frontend
   ```

2. ติดตั้ง Node dependencies:
   ```bash
   npm install
   ```

3. เริ่มต้นรันเซิร์ฟเวอร์สำหรับพัฒนาระบบ (Development Server):
   ```bash
   npm run dev
   ```

4. เปิดบราวเซอร์และเข้าถึงแอปพลิเคชันได้ที่:
   - URL: `http://localhost:5173`

---

## 📜 คำสั่งที่ใช้งานบ่อย (Useful Commands)

### **Frontend**
- `npm run dev` - รัน Development Server ด้วย HMR
- `npm run build` - ตรวจสอบ Type และ Build โปรเจกต์สำหรับการ Production
- `npm run lint` - ตรวจสอบโค้ดด้วย Oxlint
- `npm run preview` - พรีวิว Build output สำหรับ Production

---

## 📝 ทีมงานและการปรับปรุง (Team & Standards)

ข้อมูลมาตรฐานทางเทคนิคและข้อตกลงในการพัฒนาระบบสามารถดูเพิ่มเติมได้ที่ [memory-bank/standards/tech-stack.md](file:///Users/anasdareme/Documents/GitHub/sdpx-torpai/memory-bank/standards/tech-stack.md)
