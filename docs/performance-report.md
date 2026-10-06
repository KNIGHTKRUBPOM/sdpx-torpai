# Performance Report — WS-07

## Setup
- **Target System:** Local FastAPI Server (`http://127.0.0.1:8000`) & Staging API (`https://unilib-api-rlse.onrender.com`)
- **Load Profile:** Ramp 0 → 5 → 10 VUs (ระยะเวลา 2 นาที: 30s ramp-up, 1m steady state, 30s ramp-down)
- **วันที่ทดสอบ:** 2026-10-03
- **เครื่องมือ:** k6 v0.56.0 + Grafana k6 runner
- **Result Data Source:** `performance/baseline.json`

---

## Hypothesis vs Actual

| Hypothesis (ที่คาดการณ์ไว้ก่อนวัด) | ผลจริง | ผลลัพธ์ |
|---|---|---|
| `GET /api/books` (catalog search) จะช้าที่สุด p95 > 200ms จากการ filter หลายเงื่อนไข | p95 = 11.03ms (เฉลี่ย 8.76ms) | ❌ คาดผิด — เร็วกว่าที่คาดไว้มาก เนื่องจาก Data set ในช่วงเริ่มต้นยังมีขนาดเล็กและ SQLite/in-memory ทำงานได้รวดเร็ว |
| `POST /api/auth/register` จะมี Latency สูงสุดในบรรดา Endpoint | Max latency = 191.43ms ในช่วง setup registration | ✅ คาดถูก — Argon2id Password Hashing เป็นจุดที่ใช้ CPU สูงที่สุดตามหลัก Cryptographic design |
| `GET /api/loans/me` จะผ่านเกณฑ์ Threshold p95 < 300ms | p95 = 11.63ms (เฉลี่ย 9.23ms) | ✅ คาดถูก — ผ่านเกณฑ์อย่างสมบูรณ์ |

---

## Results & Metrics

สรุปผลการทดสอบจาก **505 HTTP Requests** (168 Completed Iterations, 0 Errors):

| Endpoint / Metric Tag | p50 (Median) | p90 | p95 | Max | Error Rate |
|---|---|---|---|---|---|
| `GET /api/health` (Smoke Check) | 5.59ms | 8.41ms | 10.68ms | 27.74ms | 0.00% |
| `GET /api/books` (`name:list`) | 8.50ms | 9.76ms | 11.03ms | 20.25ms | 0.00% |
| `GET /api/books?q=Algorithms` (`name:search`) | 8.90ms | 10.75ms | 12.42ms | 25.10ms | 0.00% |
| `GET /api/loans/me` (`loan_latency`) | 9.00ms | 10.71ms | 11.63ms | 17.33ms | 0.00% |
| **Overall HTTP Duration** | **8.90ms** | **10.75ms** | **12.42ms** | **191.43ms** | **0.00%** |

### สถิติเพิ่มเติม:
- **Total Requests:** 505
- **Throughput:** ~4.17 req/s (มี think time `sleep(1)` และ `sleep(2)` ตาม User Journey จริง)
- **Check Pass Rate:** 100.00% (672/672 checks passed)
- **HTTP Request Failed:** 0.00% (0/505 failed)

---

## Thresholds Verification

ทุกเกณฑ์ Threshold ที่กำหนดไว้ใน `WS-07-RUN-perf` ผ่านการทดสอบทั้งหมด (Exit code = 0):

- [x] `http_req_duration: p(95)<500`: **ผ่าน** (วัดได้ 12.42ms)
- [x] `http_req_failed: rate<0.01`: **ผ่าน** (วัดได้ 0.00%)
- [x] `errors: rate<0.05`: **ผ่าน** (วัดได้ 0.00%)
- [x] `loan_latency: p(95)<300`: **ผ่าน** (วัดได้ 11.63ms)
- [x] `http_req_duration{name:list}: p(95)<300`: **ผ่าน** (วัดได้ 11.03ms)

---

## Bottlenecks ที่ตรวจพบ

1. **Argon2id CPU Overhead ใน Auth Flow:**
   - Request ที่มี Latency สูงสุด (191.43ms) เกิดขึ้นในกระบวนการ Hashing รหัสผ่านของ User Registration/Login
   - **หลักฐาน:** `http_req_waiting max = 190.05ms` ปรากฏเฉพาะในคำขอแรกที่เรียก Authentication API
2. **Redundant Queries ใน Service Layer:**
   - ใน `LoanService.borrow` และ `return_loan` มีการเรียก `self.get_by_id()` ซ้ำหลัง `commit()` ทำให้เกิด Database round-trip เกินความจำเป็น
   - **หลักฐาน:** ตรวจพบจากการทำ Code Review ใน `docs/ai-review.md`

---

## แนวทางการปรับปรุง (สิ่งที่เตรียมแก้ใน WS-08)

1. **Database Indexing:**
   - เพิ่ม Composite Index บนตาราง `loans(user_id, returned_at)` และ `books(isbn, status)` เพื่อรองรับ Scale ข้อมูลขนาดใหญ่
   - คาดว่าจะช่วยลด Query Time เมื่อแค็ตตาล็อกมีหนังสือเกิน 10,000 รายการ
2. **Eliminate Redundant ORM Queries:**
   - ปรับปรุงการ Refresh State ของ Model แทนการ Query `SELECT JOIN` ใหม่ทั้งชุดหลัง `commit()`

---

## AI Analysis (การวิเคราะห์ร่วมกับ AI)

- **AI เสนอสาเหตุหลัก:**
  1. การ Query ซ้ำซ้อนหลัง commit ใน `LoanService`
  2. การไม่มี Index ใน Column ที่ใช้ค้นหาบ่อย (`title`, `category`)
  3. ความหน่วงของการเข้ารหัส Argon2id
- **ข้อที่ทีมยอมรับ:**
  - ยอมรับข้อ 1 และ 2 เนื่องจากมีหลักฐานชัดเจนจาก Code Review และรูปแบบการเติบโตของฐานข้อมูลจริง
- **ข้อที่ทีมไม่รับ:**
  - ไม่ยอมรับการลด Cost Factor ของ Argon2id เนื่องจากความปลอดภัยของรหัสผ่านผู้ใช้งานมีความสำคัญสูงสุด และ Latency ระดับ ~190ms ในการสมัครสมาชิกถือว่ายอมรับได้ตามเกณฑ์ OWASP
- **การวัดเพิ่มเติมที่จะดำเนินการ:**
  - ทำ Benchmarking ร่วมกับฐานข้อมูล PostgreSQL ที่มี Seed Data 10,000+ รายการ พร้อมตรวจสอบ Execution Plan ด้วย `EXPLAIN ANALYZE`
