# ⏱️ Test Loop Latency Report (ทีมต่อไป TorPai)

ผลการทดสอบการวัดเวลา Test Loop ในโปรเจกต์ **TorPai (UniLib)** สำหรับเตรียมความพร้อมก่อนเข้าเรียนเรื่อง Unit Testing:

---

## 📊 สรุปผลการจับเวลา (Baseline Latency)

| Framework | ขอบเขต (Scope) | เวลาที่ใช้รันทั้ง Test Suite | Latency เมื่อแก้ Code 1 บรรทัด (Single Test Execution) | สถานะความพร้อม |
|---|---|---|---|---|
| **pytest 9.1.1** | Backend (FastAPI) | **0.90 วินาที** | **0.03 วินาที (30 ms)** | 🟢 ผ่านมาตรฐาน (< 10 วินาที) |
| **Vitest 4.1.10** | Frontend (React + TS) | **2.27 วินาที** | **0.088 วินาที (88 ms)** | 🟢 ผ่านมาตรฐาน (< 10 วินาที) |

---

## 🛠️ คำสั่งที่ใช้ในการวัดผล (Execution Commands)

### 1. Python Backend
```bash
cd backend
python -m pytest --durations=5
```

### 2. Frontend (React / TypeScript)
```bash
cd frontend
npm test
```

### 3. Playwright E2E Verification
```bash
cd frontend
npx playwright --version
```
- **Playwright Version:** `1.62.1`
- **Browser Binary:** Chromium Installed
