# Test Loop Latency — PairEval WS-03

วัดเมื่อ 2026-08-19 บน workspace ปัจจุบัน หลังเปลี่ยน Vitest environment จาก jsdom ที่ไม่รองรับ Node 25 เป็น happy-dom

## ผลที่ยืนยันแล้ว

- Backend Pytest (Python 3.12 container): **23 passed in 1.62s**, source coverage **90%**
- Frontend Vitest: **3 passed in 7.40s** (final post-install run)
- Playwright Chromium: **2 passed in 2.5s** (เมื่อ dev server พร้อม)
- Fidelity single-test failure: **0.13s**

ทั้ง backend/frontend unit loops อยู่ต่ำกว่า budget 10 วินาทีตาม WS-03

## Commands

```powershell
# Backend — ใช้เมื่อ local Python เป็นมาตรฐาน CPython
python -m pip install -r requirements.txt
cd backend
python -m pytest -q --durations=5 --cov=src --cov-report=term-missing

# Frontend
cd frontend
npm test
npm run test:e2e
```

ถ้าอยู่ในโฟลเดอร์ `backend` อยู่แล้ว ให้ติดตั้งด้วย
`python -m pip install -r ..\requirements.txt` แทน หาก pytest แจ้งว่าไม่รู้จัก
`--cov` แปลว่า Python environment ที่กำลังใช้อยู่ยังไม่มี `pytest-cov`
ให้ตรวจด้วย `python -m pip show pytest-cov` และติดตั้ง requirements ด้วย Python
ตัวเดียวกับที่ใช้สั่ง `python -m pytest`

เครื่องที่ใช้ตรวจรอบนี้มี MSYS Python ซึ่งไม่มี compatible `pydantic-core` wheel จึงรัน backend verification ด้วย official `python:3.12-slim` container แทน; production code ไม่ได้มี Docker-specific fallback
