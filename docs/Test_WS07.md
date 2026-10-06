# คู่มือการทดสอบ WS-07: Production Loop (Performance Testing & Observability)

เอกสารฉบับนี้รวบรวมขั้นตอน วิธีการรัน และเกณฑ์การตรวจวัดผลสำหรับการทดสอบ **Workshop 07 (WS-07: Production Loop)** ของโปรเจกต์ **UniLib (ต่อไป - TorPai)**

---

## 🎯 วัตถุประสงค์ของ WS-07
- สร้าง Load Test ด้วย **k6** ที่จำลองพฤติกรรมจริงของผู้ใช้งาน (User Journey) พร้อมกำหนดเงื่อนไข **Thresholds (Pass/Fail Gate)**
- สร้างระบบ **Structured Logging (JSON)** และ **Correlation ID (`x-request-id`)** สำหรับการทำ Observability และ Trace ปัญหาในระดับ Production
- ป้องกันข้อมูลส่วนบุคคลรั่วไหลด้วยกลไก **Sensitive Data Redaction**
- เชื่อมต่อ Performance Testing เข้าเป็นขั้นตอนหนึ่งใน CI/CD Pipeline อัตโนมัติ

---

## 🚀 วิธีการทดสอบแบบคำสั่งเดียว (Automated Run)

คุณสามารถรันการทดสอบ WS-07 ครบวงจรได้ด้วย PowerShell Script:

```powershell
./test_ws07.ps1
```

Script นี้จะดำเนินการ:
1. ทดสอบ Unit Tests ของระบบ Logging และ Data Redaction
2. ตรวจสอบว่า Backend API เปิดอยู่หรือไม่ (หากยังไม่เปิด จะสตาร์ทให้อัตโนมัติ)
3. รัน k6 Smoke Test ตรวจสอบ Health Check และ Response Time
4. รัน k6 Load Test ตรวจสอบ Thresholds และส่งออกผลลัพธ์เป็น `performance/baseline.json`

---

## 🛠️ ขั้นตอนการทดสอบแบบทีละสเต็ป (Manual Step-by-Step)

### ขั้นตอนที่ 1: ตรวจสอบ Structured Logging & Correlation ID
รัน Unit Tests สำหรับระบบ Logging โดยเฉพาะ:
```bash
python -m pytest backend/tests/unit/test_logging.py -v
```
- **สิ่งที่ต้องผ่าน:**
  - `test_redact_sensitive_data`: ตรวจสอบว่าฟิลด์ `password`, `token`, `email`, `authorization` ถูกแทนที่ด้วย `[REDACTED]` เสมอ
  - `test_request_logging_middleware_correlation_id`: ตรวจสอบว่า Header `x-request-id` ถูกแนบกลับมาใน Response เสมอ

#### ทดสอบยิงคำขอจริงและตรวจจับ Log:
1. เปิด Backend:
   ```bash
   cd backend
   python -m uvicorn src.app:create_app --factory --port 8000 --reload
   ```
2. ยิง Request:
   ```bash
   curl -i http://127.0.0.1:8000/api/health
   ```
3. สังเกตใน Terminal:
   - Header ต้องมี `x-request-id: <uuid>`
   - บรรทัด Log ต้องแสดง:
     `[info] http_request duration_ms=... method=GET path=/api/health requestId=... statusCode=200 userId=None`

---

### ขั้นตอนที่ 2: รัน k6 Smoke Test
ตรวจสอบว่า Endpoint พื้นฐานตอบสนองเร็วกว่า 500ms:

```bash
# ทดสอบกับ Local
k6 run performance/smoke.js --env BASE_URL=http://127.0.0.1:8000

# หรือทดสอบกับ Staging
k6 run performance/smoke.js --env BASE_URL=https://unilib-api-rlse.onrender.com
```

- **เกณฑ์ผ่าน:**
  - `health status 200` และ `response < 500ms` ผ่าน 100%
  - `http_req_failed`: 0.00%
  - Exit code เป็น 0

---

### ขั้นตอนที่ 3: รัน k6 Load Test และจัดทำ Baseline Data
จำลองพฤติกรรมผู้ใช้ 10 VUs ตลอด 2 นาทีเต็ม (ค้นหาหนังสือ, เรียกดูรายละเอียด, ดูแดชบอร์ดการยืม):

```bash
# รันพร้อมบันทึกผลลัพธ์ Baseline
k6 run --summary-export=performance/baseline.json performance/load-test.js --env BASE_URL=http://127.0.0.1:8000
```
*(สำหรับการยิงใส่ Staging ให้เปลี่ยน `BASE_URL=https://unilib-api-rlse.onrender.com`)*

- **เกณฑ์ Thresholds ที่ต้องผ่าน:**
  - `http_req_duration`: p(95) < 500ms (ผลจริง: ~12ms)
  - `http_req_duration{name:list}`: p(95) < 300ms (ผลจริง: ~11ms)
  - `loan_latency`: p(95) < 300ms (ผลจริง: ~11ms)
  - `http_req_failed`: rate < 0.01 (ผลจริง: 0.00%)
  - `errors`: rate < 0.05 (ผลจริง: 0.00%)

---

### ขั้นตอนที่ 4: การตรวจสอบ CI Performance Gate
ในไฟล์ [`.github/workflows/ci.yml`](file:///C:/Users/User/Desktop/sdpx-torpai/.github/workflows/ci.yml) มี Job `performance` เพิ่มเข้ามา:
1. ทำงานหลังขั้นตอน `deploy-staging` สำเร็จ
2. ใช้ `grafana/setup-k6-action@v1` ติดตั้ง k6 บน GitHub Actions Runner
3. รันทั้ง `smoke.js` และ `load-test.js` ยิงใส่ Staging URL
4. อัปโหลดผลลัพธ์ `k6-results` เป็น Artifact ใน GitHub Actions

---

## 📊 เอกสารและ Artifacts ที่เกี่ยวข้อง
- [`performance/smoke.js`](file:///C:/Users/User/Desktop/sdpx-torpai/performance/smoke.js): สคริปต์ k6 Smoke Test
- [`performance/load-test.js`](file:///C:/Users/User/Desktop/sdpx-torpai/performance/load-test.js): สคริปต์ k6 Load Test
- [`performance/baseline.json`](file:///C:/Users/User/Desktop/sdpx-torpai/performance/baseline.json): ข้อมูลผลการทดสอบโหลด 2 นาที
- [`docs/performance-report.md`](file:///C:/Users/User/Desktop/sdpx-torpai/docs/performance-report.md): รายงานสรุปผลการทดสอบ, วิเคราะห์ Bottleneck และ AI Analysis
- [`docs/ai-review.md`](file:///C:/Users/User/Desktop/sdpx-torpai/docs/ai-review.md): AI Code Review สำหรับเตรียมเข้าสู่ WS-08
