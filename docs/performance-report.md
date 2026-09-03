# PairEval performance baseline

วันที่ทดสอบ: 3 September 2026

## Environment และ workload

- Docker Desktop: PostgreSQL 17.6, FastAPI/Uvicorn 6 workers และ frontend Nginx
- ข้อมูล: 200 นักศึกษา, 40 กลุ่ม, 1 group criterion
- Workload: 200 VU เริ่มเปิดหน้า Evaluation พร้อมกัน คนละ 1 workflow
- แต่ละ VU อ่านคู่ 3–8 วินาทีแบบ deterministic ก่อน autosave แล้ว submit
- เหตุผล: NFR-PERF-01 ระบุ 200 concurrent users สำหรับหน้า Evaluation ส่วน autosave/submit
  เกิดหลังผู้ใช้พิจารณาคู่ ไม่ใช่ทุกคนคลิกในมิลลิวินาทีเดียวกัน
- Script: `performance/paireval.js`; raw output: `performance/k6-summary.json`

## ผลเทียบ PRD

| Requirement | Threshold | Result | Status |
|---|---:|---:|---|
| Evaluation p95 | ≤ 2,000 ms | 349.71 ms | PASS |
| Evaluation p99 | ≤ 4,000 ms | 395.52 ms | PASS |
| Autosave p95 | ≤ 300 ms | 8.87 ms | PASS |
| Submission p95 | ≤ 800 ms | 65.05 ms | PASS |
| Pair generation | ≤ 10,000 ms | 839.85 ms | PASS |
| Full recompute | ≤ 30,000 ms | 73.96 ms | PASS |
| HTTP error rate | < 1% | 0.00% (0/606) | PASS |

ผลนี้เป็น local baseline ที่ทำซ้ำได้ ไม่แทน production capacity certification ต้องรัน scheduled CI
และทดสอบซ้ำบน staging infrastructure ก่อนเปิดใช้กับห้องจริง
