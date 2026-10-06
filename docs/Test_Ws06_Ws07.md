# คู่มือวิธีการรันและตรวจสอบการทดสอบแลป WS-06 และ WS-07 (Test Runbook)

เอกสารฉบับนี้จัดทำขึ้นสำหรับโปรเจกต์ **UniLib (ต่อไป - TorPai)** เพื่ออธิบายขั้นตอน คำสั่ง และเกณฑ์การตรวจวัดผลสำหรับการรันแลป **WS-06 (Integration Loop / CI/CD)** และ **WS-07 (Production Loop / Performance Testing & Observability)** ตามมาตรฐานของคอร์ส SDPX-AI

---

## 📑 สารบัญ
1. [ภาพรวมของแต่ละ Workshop](#1-ภาพรวมของแต่ละ-workshop)
2. [ข้อกำหนดเบื้องต้นของเครื่อง (Prerequisites)](#2-ข้อกำหนดเบื้องต้นของเครื่อง-prerequisites)
3. [ขั้นตอนการทดสอบ WS-06: Integration Loop (CI/CD)](#3-ขั้นตอนการทดสอบ-ws-06-integration-loop-cicd)
   - [3.1 Local CI Reproduction (รันเกตในเครื่องก่อน Push)](#31-local-ci-reproduction-รันเกตในเครื่องก่อน-push)
   - [3.2 Full-stack E2E ใน Docker Container](#32-full-stack-e2e-ใน-docker-container)
   - [3.3 การตรวจสอบบน GitHub Actions Pipeline](#33-การตรวจสอบบน-github-actions-pipeline)
   - [3.4 การตรวจสอบ Branch Protection Gate](#34-การตรวจสอบ-branch-protection-gate)
4. [ขั้นตอนการทดสอบ WS-07: Production Loop (Performance & Observability)](#4-ขั้นตอนการทดสอบ-ws-07-production-loop-performance--observability)
   - [4.1 สตาร์ท Backend API เพื่อทดสอบ](#41-สตาร์ท-backend-api-เพื่อทดสอบ)
   - [4.2 การรัน k6 Smoke Test](#42-การรัน-k6-smoke-test)
   - [4.3 การรัน k6 Load Test และส่งออก baseline.json](#43-การรัน-k6-load-test-และส่งออก-baselinejson)
   - [4.4 การตรวจสอบ Structured Logging และ Correlation ID](#44-การตรวจสอบ-structured-logging-และ-correlation-id)
   - [4.5 การตรวจสอบ Performance Gate บน GitHub Actions](#45-การตรวจสอบ-performance-gate-บน-github-actions)
5. [รายการ Artifacts ที่ต้องส่งและตรวจสอบ](#5-รายการ-artifacts-ที่ต้องส่งและตรวจสอบ)

---

## 1. ภาพรวมของแต่ละ Workshop

| Workshop | Loop Name | วัตถุประสงค์หลัก | Artifacts สำคัญ |
|---|---|---|---|
| **WS-06** | **Integration Loop** | รวมทุก loop (Lint, Unit, E2E, Deploy) ให้เป็น Pipeline อัตโนมัติบน GitHub Actions ที่หลบไม่ได้ | [`.github/workflows/ci.yml`](file:///C:/Users/User/Desktop/sdpx-torpai/.github/workflows/ci.yml), [`docs/loop-metrics.md`](file:///C:/Users/User/Desktop/sdpx-torpai/docs/loop-metrics.md) |
| **WS-07** | **Production Loop** | วัดประสิทธิภาพระบบด้วย k6 Load Test, ทำ Structured Logging + Correlation ID และส่งออกรายงาน | [`performance/smoke.js`](file:///C:/Users/User/Desktop/sdpx-torpai/performance/smoke.js), [`performance/load-test.js`](file:///C:/Users/User/Desktop/sdpx-torpai/performance/load-test.js), [`performance/baseline.json`](file:///C:/Users/User/Desktop/sdpx-torpai/performance/baseline.json), [`docs/performance-report.md`](file:///C:/Users/User/Desktop/sdpx-torpai/docs/performance-report.md), [`docs/ai-review.md`](file:///C:/Users/User/Desktop/sdpx-torpai/docs/ai-review.md) |

---

## 2. ข้อกำหนดเบื้องต้นของเครื่อง (Prerequisites)

- **Python:** 3.10 ขึ้นไป (ติดตั้งแพ็กเกจด้วย `pip install -r requirements.txt`)
- **Node.js:** v20 หรือ v24 (ติดตั้งแพ็กเกจด้วย `cd frontend && npm ci`)
- **Docker Desktop:** สำหรับรัน Full-stack Container Test Suite
- **k6 CLI:** v0.50 ขึ้นไป (ตรวจสอบด้วยคำสั่ง `k6 version`)
  - *ติดตั้งบน Windows (หากยังไม่มี):* `winget install GrafanaLabs.k6` หรือดาวน์โหลด binary ไว้ใน PATH

---

## 3. ขั้นตอนการทดสอบ WS-06: Integration Loop (CI/CD)

หลักการของ WS-06 คือ **"Reproduce ใน Local ก่อน Push เสมอ"** เพื่อไม่ให้ Commit History เปรอะไปด้วยคำสั่งแก้ CI ซ้ำ ๆ

### 3.1 Local CI Reproduction (รันเกตในเครื่องก่อน Push)

#### 1) ตรวจสอบ Frontend (Lint + Typecheck + Unit Tests)
เปิดเทอร์มินัลเข้าไปที่โฟลเดอร์ `frontend`:
```bash
cd frontend
npm run lint
npm run build
npm test -- --run
```
- **เกณฑ์ผ่าน:**
  - Oxlint ไม่พบข้อผิดพลาดระดับ error (Exit code: 0)
  - TypeScript typecheck (`tsc -b`) และ Vite build สำเร็จ
  - Vitest รันผ่านครบทุก test files

#### 2) ตรวจสอบ Backend (Unit Tests + Coverage)
เปิดเทอร์มินัลที่รูทของโปรเจกต์:
```bash
python -m pytest backend/tests -q --cov=backend/src --cov-report=term-missing
```
- **เกณฑ์ผ่าน:**
  - ผ่านครบทั้ง 30 tests (Exit code: 0) ในเวลาไม่เกิน 4 วินาที

---

### 3.2 Full-stack E2E ใน Docker Container

คำสั่งนี้จำลองการทำงานเหมือนกับ Runner บน GitHub Actions แบบ 100%:
```bash
# รันทั้งระบบ (Backend + Frontend + DB + Playwright E2E)
docker compose -p unilib-test -f compose.test.yaml up --build --abort-on-container-exit --exit-code-from e2e

# ตรวจสอบ Exit code (ต้องได้ 0)
echo $LASTEXITCODE   # บน PowerShell
# echo $?            # บน Bash / Linux / macOS

# เมื่อเสร็จสิ้น ทำการคลีนอัป Container
docker compose -p unilib-test -f compose.test.yaml down -v --remove-orphans
```

---

### 3.3 การตรวจสอบบน GitHub Actions Pipeline

เมื่อ Push โค้ดไปยังบรันช์ `develop` หรือเปิด Pull Request:
1. เข้าไปที่แท็บ **Actions** บน GitHub Repository
2. ตรวจสอบว่า Workflow **CI/CD Pipeline** ทำงานครบทุก Job:
   - ✅ `lint-and-unit-test`: รัน Lint, Typecheck, Frontend Vitest, Backend Pytest + Coverage
   - ✅ `e2e-tests`: รัน Docker compose E2E tests พร้อมอัปโหลด HTML report
   - ✅ `deploy-staging`: ดีพลอยขึ้น Staging อัตโนมัติ (เฉพาะ event push บน `develop`)

---

### 3.4 การตรวจสอบ Branch Protection Gate

1. สร้างบรันช์ทดสอบชั่วคราว:
   ```bash
   git switch -c test/break-pipeline
   ```
2. แก้ไขให้เทสต์ตัวใดตัวหนึ่งล้มเหลว (Intentional Fail) แล้ว commit + push
3. เปิด Pull Request เข้าสู่ `main`
4. **สิ่งที่ต้องเห็น:** Pipeline แสดงสถานะสีแดง และปุ่ม **Merge** ถูกบล็อกไม่อนุญาตให้กดรวมโค้ด

---

## 4. ขั้นตอนการทดสอบ WS-07: Production Loop (Performance & Observability)

---

### 4.1 สตาร์ท Backend API เพื่อทดสอบ

สำหรับการทดสอบในเครื่อง ให้รัน FastAPI Backend Service:
```bash
cd backend
python -m uvicorn src.app:create_app --factory --port 8000 --reload
```
หรือหากต้องการทดสอบกับ Staging ให้ใช้ URL: `https://unilib-api-rlse.onrender.com`

---

### 4.2 การรัน k6 Smoke Test

ใช้สำหรับทดสอบสุขภาพของระบบเบื้องต้น (Smoke Check) และวัด Response Time ว่าต่ำกว่า 500ms หรือไม่:

#### คำสั่งรันกับ Local:
```bash
k6 run performance/smoke.js --env BASE_URL=http://127.0.0.1:8000
```

#### คำสั่งรันกับ Staging:
```bash
k6 run performance/smoke.js --env BASE_URL=https://unilib-api-rlse.onrender.com
```

#### ผลลัพธ์ที่คาดหวัง:
```text
✓ health status 200
✓ health is ok
✓ response < 500ms

checks.........................: 100.00%
http_req_duration..............: avg < 10ms, p(95) < 500ms
http_req_failed................: 0.00%
```

---

### 4.3 การรัน k6 Load Test และส่งออก baseline.json

สคริปต์นี้จะจำลอง User Journey จริง (Browse Catalog, Search Keyword, Dashboard) โดยมี Think Time และแบ่งเป็น 3 Stages:
- **0–30s:** Ramp up ขึ้นไปที่ 5 VUs
- **30s–1m30s:** คงที่ที่ 10 VUs (Steady State)
- **1m30s–2m00s:** Ramp down กลับลงมาที่ 0 VUs

#### คำสั่งรันพร้อมส่งออกผลลัพธ์ Baseline:
```bash
k6 run --summary-export=performance/baseline.json performance/load-test.js --env BASE_URL=http://127.0.0.1:8000
```
*(หากต้องการชี้ไปที่ Staging ให้เปลี่ยน `BASE_URL=https://unilib-api-rlse.onrender.com`)*

#### เกณฑ์ Threshold ที่ต้องผ่าน (Exit Code ต้องเป็น 0):
- `http_req_duration`: p(95) < 500ms
- `http_req_duration{name:list}`: p(95) < 300ms
- `loan_latency`: p(95) < 300ms
- `http_req_failed`: rate < 0.01 (ล้มเหลวน้อยกว่า 1%)
- `errors`: rate < 0.05 (ผิดพลาดน้อยกว่า 5%)

---

### 4.4 การตรวจสอบ Structured Logging และ Correlation ID

ระบบของ UniLib มีการติดตั้ง Structured Logger ด้วย `structlog` และ Middleware บันทึก Correlation ID

#### 1) ตรวจสอบผ่าน Unit Tests:
```bash
python -m pytest backend/tests/unit/test_logging.py -v
```
- ต้องผ่านทั้ง 2 การทดสอบ:
  - `test_redact_sensitive_data`: ยืนยันว่า `password`, `token`, `email`, `authorization` ถูกแปลงเป็น `[REDACTED]`
  - `test_request_logging_middleware_correlation_id`: ยืนยันว่า Header `x-request-id` ถูกสร้างและส่งกลับทุกคำขอ

#### 2) ตรวจสอบ Response Header จริงด้วย curl:
```bash
curl -i http://127.0.0.1:8000/api/health
```
- ใน HTTP Header ต้องมี `x-request-id: <uuid>`

#### 3) ตรวจสอบ Structured Log Output ใน Terminal:
เมื่อมี Request เข้ามา ตัวแอปพลิเคชันจะพิมพ์ Log แบบมีฟิลด์กำกับครบถ้วน:
```text
[info] http_request duration_ms=2.26 method=GET path=/api/health requestId=... statusCode=200 userId=None
```
*(ใน Production Environment (`APP_ENV=production`) บันทึกจะถูกส่งออกเป็น Pure JSON)*

---

### 4.5 การตรวจสอบ Performance Gate บน GitHub Actions

ในไฟล์ [`.github/workflows/ci.yml`](file:///C:/Users/User/Desktop/sdpx-torpai/.github/workflows/ci.yml) ได้กำหนด Job `performance`:
- จะถูกทริกเกอร์อัตโนมัติเมื่อเกิดการ Push ไปยังบรันช์ `develop` (หลังขั้นตอน `deploy-staging` สำเร็จ)
- ระบบจะใช้ `grafana/setup-k6-action@v1` รัน Smoke Check และ Load Test ใส่ Staging URL
- อัปโหลด Artifact `k6-results` เก็บไว้เป็นหลักฐานการวัดผล

---

## 5. รายการ Artifacts ที่ต้องส่งและตรวจสอบ

| ไฟล์เอกสาร / โค้ด | รายละเอียด | ที่อยู่ไฟล์ |
|---|---|---|
| **Pipeline Workflow** | GitHub Actions Pipeline ที่รัน Unit, E2E, Deploy และ Performance | [`.github/workflows/ci.yml`](file:///C:/Users/User/Desktop/sdpx-torpai/.github/workflows/ci.yml) |
| **Loop Metrics** | สถิติตัวเลขระยะเวลาการทดสอบก่อนและหลังการทำ CI/CD | [`docs/loop-metrics.md`](file:///C:/Users/User/Desktop/sdpx-torpai/docs/loop-metrics.md) |
| **k6 Smoke Script** | สคริปต์ตรวจความพร้อมของ Health Check และ Latency เบื้องต้น | [`performance/smoke.js`](file:///C:/Users/User/Desktop/sdpx-torpai/performance/smoke.js) |
| **k6 Load Script** | สคริปต์ Load Test จำลอง User Journey จริงพร้อมกำหนดเกณฑ์ Threshold | [`performance/load-test.js`](file:///C:/Users/User/Desktop/sdpx-torpai/performance/load-test.js) |
| **Baseline Data** | ผลลัพธ์ดิบจากการทดสอบโหลด 2 นาทีเต็ม (k6 Summary Export) | [`performance/baseline.json`](file:///C:/Users/User/Desktop/sdpx-torpai/performance/baseline.json) |
| **Performance Report** | รายงานสรุปผลการทดสอบ, Hypothesis vs Actual, Bottlenecks และ AI Analysis | [`docs/performance-report.md`](file:///C:/Users/User/Desktop/sdpx-torpai/docs/performance-report.md) |
| **AI Code Review** | ผลการวิเคราะห์โค้ดสำหรับเตรียมนำไป Refactor ใน WS-08 | [`docs/ai-review.md`](file:///C:/Users/User/Desktop/sdpx-torpai/docs/ai-review.md) |
| **Structured Logger** | โค้ดระบบบันทึก Log แบบ JSON และตัวกรองข้อมูลลับ | [`backend/src/logger.py`](file:///C:/Users/User/Desktop/sdpx-torpai/backend/src/logger.py) |
| **Correlation Middleware** | Middleware จัดการ `x-request-id` และวัด latency แต่ละ request | [`backend/src/logging_middleware.py`](file:///C:/Users/User/Desktop/sdpx-torpai/backend/src/logging_middleware.py) |
