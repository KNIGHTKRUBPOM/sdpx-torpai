# คู่มือการทดสอบ WS-06: Integration Loop (CI/CD Pipeline)

เอกสารฉบับนี้รวบรวมขั้นตอน วิธีการรัน และเกณฑ์การตรวจวัดผลสำหรับการทดสอบ **Workshop 06 (WS-06: Integration Loop)** ของโปรเจกต์ **UniLib (ต่อไป - TorPai)**

---

## 🎯 วัตถุประสงค์ของ WS-06
- รวมทุก Feedback Loop ย่อย (Linting, Typechecking, Unit Tests, End-to-End Tests, Deployment) ให้เป็น **Integration Gate เดียว**
- ทำให้ผลลัพธ์ของ CI เป็นสิ่งที่ **"หลบไม่ได้"** โดยบังคับใช้ผ่าน GitHub Branch Protection Rules
- ปฏิบัติตามกฎ: **"Reproduce ใน Local ให้เขียวก่อน Push เสมอ"** เพื่อลดจำนวน Commit ที่ไม่จำเป็น

---

## 🚀 วิธีการทดสอบแบบคำสั่งเดียว (Automated Run)

คุณสามารถรันการทดสอบ WS-06 ทั้งหมดในเครื่องได้ทันทีด้วย PowerShell Script:

```powershell
./test_ws06.ps1
```

Script นี้จะรัน 4 ขั้นตอนตามลำดับเหมือนกับบน GitHub Actions Runner:
1. Backend Unit Tests + Coverage (`pytest`)
2. Frontend Linting (`oxlint`)
3. Frontend Typecheck & Build (`tsc + vite`)
4. Frontend Component Tests (`vitest`)

---

## 🛠️ ขั้นตอนการทดสอบแบบทีละสเต็ป (Manual Step-by-Step)

### ขั้นตอนที่ 1: ตรวจสอบฝั่ง Backend (Unit Tests & Coverage)
เปิด Terminal ที่โฟลเดอร์ Root ของโปรเจกต์:
```bash
python -m pytest backend/tests -q --cov=src --cov-report=term-missing
```
- **สิ่งที่ต้องผ่าน:**
  - ผ่านครบ 30/30 tests (รวมถึง test_borrow_service, test_library_services, test_api, test_logging)
  - รายงาน Coverage ต้องครอบคลุม Logic สำคัญใน `backend/src/`

---

### ขั้นตอนที่ 2: ตรวจสอบฝั่ง Frontend (Lint, Build, Vitest)
เปิด Terminal และเข้าไปที่โฟลเดอร์ `frontend`:
```bash
cd frontend

# 1. ตรวจสอบโค้ดด้วย Linter
npm run lint

# 2. ตรวจสอบ Type และทดสอบ Build สำหรับ Production
npm run build

# 3. รัน Unit/Component Tests
npm test -- --run
```
- **สิ่งที่ต้องผ่าน:**
  - `oxlint` ไม่พบข้อผิดพลาดระดับ error
  - `tsc -b` ไม่มีปัญหา Type Error และ `vite build` สำเร็จ ได้ไฟล์ในโฟลเดอร์ `dist/`
  - Vitest ผ่านครบ 4/4 tests (`App.test.tsx`, `RouterApp.test.tsx`)

---

### ขั้นตอนที่ 3: ตรวจสอบ Full-stack E2E ใน Docker Container
รัน Stack ทั้งหมด (PostgreSQL + Backend + Frontend + Playwright) ใน Container แบบเดียวกับ GitHub Actions:
```bash
# สตาร์ทและรัน E2E Tests
docker compose -p unilib-test -f compose.test.yaml up --build --abort-on-container-exit --exit-code-from e2e

# ตรวจสอบ Exit Code (ต้องเป็น 0)
echo $LASTEXITCODE   # PowerShell
# echo $?            # Bash / Linux / macOS

# เคลียร์ Container เมื่อเสร็จสิ้น
docker compose -p unilib-test -f compose.test.yaml down -v --remove-orphans
```

---

### ขั้นตอนที่ 4: การตรวจสอบบน GitHub Actions CI/CD Pipeline
1. เมื่อทำการ Push โค้ดไปยังบรันช์ `develop` หรือเปิด Pull Request เข้าสู่ `develop` หรือ `main`
2. ตรวจสอบแท็บ **Actions** ใน GitHub Repository:
   - Job `lint-and-unit-test` ต้องรันผ่านและขึ้นไฟเขียว
   - Job `e2e-tests` ต้องรันผ่านและมี Artifact `playwright-report`
   - Job `deploy-staging` ต้องทำการ Deploy ขึ้น Render & Vercel อัตโนมัติ (เฉพาะ push บน develop)

---

### ขั้นตอนที่ 5: การพิสูจน์ Branch Protection Gate (บังคับตาม Lab)
1. สวิตช์ไปบรันช์ทดสอบ:
   ```bash
   git switch -c test/break-pipeline
   ```
2. แก้ไขเทสต์ 1 ตัวให้ Fail จงใจให้พัง เช่น แก้ใน `backend/tests/test_main.py`
3. Commit และ Push ไปที่ GitHub:
   ```bash
   git commit -am "test: intentionally break pipeline"
   git push -u origin test/break-pipeline
   ```
4. เปิด Pull Request บน GitHub
5. **ผลที่ต้องเห็น:** Pipeline ขึ้นสีแดง และปุ่ม **Merge Pull Request** ถูกปิดล็อก (Blocked)
6. บันทึกภาพหน้าจอเก็บไว้ใน `docs/screenshots/` แล้วลบบรันช์ทดสอบทิ้ง

---

## 📊 เอกสารและ Artifacts ที่เกี่ยวข้อง
- [`.github/workflows/ci.yml`](file:///C:/Users/User/Desktop/sdpx-torpai/.github/workflows/ci.yml): นิยาม Pipeline ของ GitHub Actions
- [`docs/loop-metrics.md`](file:///C:/Users/User/Desktop/sdpx-torpai/docs/loop-metrics.md): ตารางบันทึกสถิติ Latency และ Lead Time ก่อน-หลังการทำ CI/CD
