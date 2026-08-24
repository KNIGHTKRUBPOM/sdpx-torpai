# Homework: เตรียมพร้อมก่อนเรียน Performance & Observability

## 🎯 ทำแล้วได้อะไร

| สิ่งที่จะทำได้ | ใช้ในงานจริงอย่างไร |
|---|---|
| รัน load test ตัวแรกและอ่านผลเป็น | load test เป็นงานที่มักตกอยู่กับ developer ไม่ใช่ทีมแยกอีกต่อไป |
| เพิ่ม health endpoint ให้ระบบ | เป็นสิ่งที่ทุก platform ใช้ตัดสินว่า service พร้อมรับ traffic หรือยัง |
| สังเกต exit code เมื่อ threshold ไม่ผ่าน | เป็นกลไกที่ทำให้ performance กลายเป็นด่านจริงใน CI |
| เก็บ AI review ไว้ใช้ในสัปดาห์หน้า | ฝึกแยกขั้น "รวบรวมข้อมูล" ออกจากขั้น "ลงมือแก้" |

---

## งานที่ต้องทำก่อนเข้าห้อง

### 1. รัน k6 Smoke Test กับ Staging
สร้าง `performance/smoke.js`:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 3,
  duration: '30s',
  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const res = http.get(__ENV.BASE_URL || 'http://localhost:3000');
  check(res, {
    'status 200': (r) => r.status === 200,
    'response < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

```bash
k6 run performance/smoke.js
# หรือชี้ไป staging
BASE_URL=https://your-staging-url k6 run performance/smoke.js
```

บันทึกค่าที่ได้: `p(95)`, `http_req_failed`, `http_reqs/s`
และสังเกตว่า **k6 exit code เป็นอะไร** เมื่อ threshold ไม่ผ่าน (จะใช้ตอนต่อเข้า CI)

### 2. เตรียม Health Endpoint
ถ้ายังไม่มี ให้เพิ่ม `GET /api/health` ที่ตอบ 200 พร้อม JSON สั้น ๆ:
```json
{ "status": "ok", "version": "abc1234" }
```
ใช้ทั้งใน `HEALTHCHECK` ของ Docker (WS-05) และเป็น target ของ smoke test

### 3. เตรียม Function สำหรับ WS-08
เลือก function ที่คิดว่าแย่ที่สุดใน codebase แล้ว prompt:
```
Review this code and list ALL problems you find.
Be specific about: code smells, naming, missing error handling,
performance problems, and security issues.
Rate each issue: High / Medium / Low severity, and say why it matters.

[วาง code]
```
บันทึก response ไว้ใน `docs/ai-review.md` — **ยังไม่ต้องแก้** เก็บไว้ทำใน WS-08

---

## 🔗 ของที่ทำมา จะกลายเป็นอะไรในห้อง

งานทุกชิ้นในหน้านี้ถูกออกแบบให้เป็น **วัตถุดิบของ lab** ไม่ใช่แบบฝึกหัดที่ทำแล้วทิ้ง
คาบเรียนเริ่มจากสมมติฐานว่าของเหล่านี้พร้อมแล้ว

| ผลงานจาก homework | ถูกใช้ต่อที่ | ถ้ายังไม่มี |
|---|---|---|
| ผลการรัน k6 smoke test กับ staging | lab ขั้นตอนที่ 1 — เริ่มจากสคริปต์ที่ยิงติดแล้ว | เสียเวลาครึ่ง lab ไปกับการ debug การเชื่อมต่อและ auth กับ staging |
| health endpoint | lab ขั้นตอนที่ 3 — ให้ CI ตรวจว่า staging พร้อมก่อนยิง load | pipeline จะยิง load ใส่ระบบที่ยังไม่พร้อม แล้วได้ผลที่อ่านไม่ได้ |
| function ที่เลือกไว้สำหรับ WS-08 | สัปดาห์หน้า — เป็นเป้าหมาย refactor | สัปดาห์หน้าต้องใช้เวลาหาเป้าหมายใหม่ |

> ถ้าทำไม่ทันข้อไหน ให้แจ้งใน 5 นาทีแรกของคาบ — จะได้จัดคู่ช่วยกันได้ทัน
> อย่าเงียบไว้แล้วไปติดกลาง lab เพราะจะกระทบทั้งกลุ่ม
