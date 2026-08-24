# Lab: Performance Testing & the Production Loop

## เวลา: 1.5 ชั่วโมง
## เป้าหมาย
สร้าง load test ที่รันซ้ำได้และมีเกณฑ์ pass/fail, เพิ่ม structured logging, แล้วต่อเข้า CI

> ⚠️ ยิง load test ใส่ **staging ของกลุ่มตัวเอง** เท่านั้น
> ห้ามยิงใส่ production หรือระบบของคนอื่น

## 🎯 ทำ lab นี้แล้วได้ทักษะอะไร

| สิ่งที่จะทำได้ | ใช้ในงานจริงอย่างไร |
|---|---|
| เขียน load test ที่จำลอง user journey จริง ไม่ใช่ยิง endpoint เดียว | ผลจากการยิงรัวไม่สะท้อนพฤติกรรมผู้ใช้ และทำให้ตัดสินใจผิด |
| เขียนรายงาน performance ที่มีตัวเลขและหลักฐาน | รายงานที่บอกแค่ "ระบบช้า" ไม่ทำให้ใครแก้อะไรได้ |
| ใส่ correlation id และ redact ข้อมูลอ่อนไหวใน log | log ที่มีข้อมูลส่วนบุคคลเป็นปัญหาทางกฎหมาย ไม่ใช่แค่เรื่องเทคนิค |
| ต่อ performance gate เข้ากับ CI | ทำให้คุณภาพด้านความเร็วถูกรักษาไว้โดยอัตโนมัติ ไม่ต้องพึ่งความจำของคน |

---

## 📦 ของที่ต้องมีอยู่แล้วก่อนเริ่ม lab

lab นี้ **ไม่เริ่มจากศูนย์** — มันต่อยอดจากงานใน `WS-07--before` ทันที
ถ้าแถวไหนยังว่าง ให้จัดการแถวนั้นก่อนเป็นอย่างแรก แล้วค่อยไล่ขั้นตอนตามปกติ

| ต้องมี | จะถูกใช้ที่ | ถ้ายังไม่มี |
|---|---|---|
| ผลการรัน k6 smoke test กับ staging | lab ขั้นตอนที่ 1 — เริ่มจากสคริปต์ที่ยิงติดแล้ว | เสียเวลาครึ่ง lab ไปกับการ debug การเชื่อมต่อและ auth กับ staging |
| health endpoint | lab ขั้นตอนที่ 3 — ให้ CI ตรวจว่า staging พร้อมก่อนยิง load | pipeline จะยิง load ใส่ระบบที่ยังไม่พร้อม แล้วได้ผลที่อ่านไม่ได้ |
| function ที่เลือกไว้สำหรับ WS-08 | สัปดาห์หน้า — เป็นเป้าหมาย refactor | สัปดาห์หน้าต้องใช้เวลาหาเป้าหมายใหม่ |

**แผนสำรองเมื่อของไม่ครบ:** จับคู่กับเพื่อนที่ทำมาแล้ว ใช้เครื่องของเขาเดินต่อ
แล้วตามเก็บงานของตัวเองหลังคาบ — สิ่งที่ห้ามทำคือให้ทั้งกลุ่มหยุดรอคนเดียว

---

## ขั้นตอนที่ 1 — Load Test Script ที่สมจริง (30 นาที)

### สร้าง `performance/load-test.js`

```javascript
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate      = new Rate('errors');
const bookingLatency = new Trend('booking_latency', true);

export const options = {
  stages: [
    { duration: '30s', target: 5  },   // ramp up
    { duration: '1m',  target: 10 },   // steady state
    { duration: '30s', target: 0  },   // ramp down
  ],
  thresholds: {
    'http_req_duration':                  ['p(95)<500'],
    'http_req_failed':                    ['rate<0.01'],
    'errors':                             ['rate<0.05'],
    'booking_latency':                    ['p(95)<300'],
    // เจาะจงราย endpoint ด้วย tag `name`
    'http_req_duration{name:list}':       ['p(95)<300'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // จำลอง user journey จริง ไม่ใช่ยิง endpoint เดียวรัว ๆ
  group('Browse and select', () => {
    const listRes = http.get(`${BASE_URL}/api/[resource]`, {
      tags: { name: 'list' },     // tag ทำให้ตั้ง threshold ราย endpoint ได้
    });
    check(listRes, {
      'list status 200': (r) => r.status === 200,
      'list has items':  (r) => r.json().length > 0,
    });
    errorRate.add(listRes.status !== 200);
    sleep(1);                      // think time — คนไม่ได้คลิกรัว

    const detailRes = http.get(`${BASE_URL}/api/[resource]/1`, {
      tags: { name: 'detail' },
    });
    check(detailRes, { 'detail status 200': (r) => r.status === 200 });
    sleep(1);
  });

  group('Create action', () => {
    const createRes = http.post(
      `${BASE_URL}/api/[resource]`,
      JSON.stringify({ /* test data */ }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'create' },
      }
    );
    // ใช้เวลาที่ k6 วัดเอง แม่นกว่า Date.now() ฝั่ง script
    bookingLatency.add(createRes.timings.duration);

    check(createRes, { 'create status 201': (r) => r.status === 201 });
    errorRate.add(createRes.status !== 201);
    sleep(2);
  });
}
```

### รันและบันทึก Baseline
```bash
k6 run --summary-export=performance/baseline.json performance/load-test.js
# หรือชี้ไป staging
BASE_URL=https://your-staging-url k6 run \
  --summary-export=performance/baseline.json performance/load-test.js

echo "exit code: $?"   # ≠ 0 แปลว่ามี threshold ไม่ผ่าน
```

### เขียน `docs/performance-report.md`
```markdown
# Performance Report — WS-07

## Setup
- Target: [staging URL]
- Load profile: ramp 0→5→10 VUs, รวม 2 นาที
- วันที่ทดสอบ: [วันที่]

## Hypothesis vs Actual
| Hypothesis (ที่เดาไว้ก่อนวัด) | ผลจริง | ถูก/ผิด |
|---|---|---|
| [endpoint] จะช้าที่สุด p95 > 500ms | p95 = ___ms | |

## Results
| Endpoint | p50 | p95 | error rate |
|---|---|---|---|
| GET /api/[resource] | | | |
| POST /api/[resource] | | | |

## Threshold ที่ไม่ผ่าน
[ระบุ + สาเหตุที่สงสัย]

## Bottleneck ที่พบ
[endpoint ไหน + เวลาหมดไปกับอะไร + หลักฐานที่ใช้สรุป]

## สิ่งที่จะแก้ (ยังไม่แก้ในวันนี้)
1. [แนวทาง] — คาดว่าจะทำให้ p95 ลดจาก ___ เหลือ ___
```

**ห้ามเขียนแค่ "ระบบช้า"** — ต้องมีตัวเลขและหลักฐานเสมอ

---

## ขั้นตอนที่ 2 — Structured Logging (25 นาที)

### ติดตั้ง Logger
```bash
# Node.js
npm install pino
npm install --save-dev pino-pretty

# Python
pip install structlog
```

### Setup Logger
```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  // ห้ามให้ field เหล่านี้หลุดออกไปใน log
  redact: ['req.headers.authorization', '*.password', '*.token', '*.email'],
  ...(process.env.NODE_ENV === 'development' && {
    transport: { target: 'pino-pretty' },
  }),
});
```

### Request Logging Middleware พร้อม Correlation ID
```typescript
// middleware/logging.ts
import { randomUUID } from 'node:crypto';

export function requestLogger(req, res, next) {
  const start = Date.now();
  req.id = req.headers['x-request-id'] ?? randomUUID();
  res.setHeader('x-request-id', req.id);

  res.on('finish', () => {
    logger.info({
      event: 'http_request',
      requestId: req.id,
      method: req.method,
      path: req.route?.path ?? req.path,   // ใช้ route pattern ไม่ใช่ path ที่มี id
      statusCode: res.statusCode,
      duration_ms: Date.now() - start,
      userId: req.user?.id,
    });
  });

  next();
}
```

> ใช้ `route pattern` (`/rooms/:id`) แทน path จริง (`/rooms/842`)
> ไม่งั้นการรวมสถิติจะแตกเป็นล้านกลุ่มและ log จะมี id ของ user ปนอยู่

### Business Event Logging
```typescript
logger.info({
  event: 'booking_created',
  requestId: req.id,
  bookingId: result.id,
  userId,
  duration_ms: Date.now() - start,
});

logger.error({
  event: 'booking_failed',
  requestId: req.id,
  reason: error.code,          // ใช้ code ไม่ใช่ message ที่เปลี่ยนได้
  userId,
});
```

### ยืนยันว่าใช้งานได้จริง
```bash
# รัน app แล้วยิง request ปกติ 1 ครั้ง จากนั้น:
docker compose logs app | grep booking_created | tail -1 | jq .
```
ต้องได้ JSON ที่มี `event`, `requestId`, `duration_ms` ครบ และ **ไม่มี email/token**

---

## ขั้นตอนที่ 3 — ต่อเข้า CI (20 นาที)

เพิ่ม job ใน `.github/workflows/ci.yml`:
```yaml
  performance:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'

    steps:
      - uses: actions/checkout@v7

      - name: Setup k6
        uses: grafana/setup-k6-action@v1

      - name: Run Performance Tests
        run: k6 run --summary-export=performance/results.json performance/load-test.js
        env:
          BASE_URL: ${{ vars.STAGING_URL }}

      - name: Upload Results
        uses: actions/upload-artifact@v7
        if: always()
        with:
          name: k6-results-${{ github.sha }}
          path: performance/results.json
```

> ใช้ `grafana/setup-k6-action` แทนการ `curl` ไฟล์ release เอง —
> เวอร์ชันที่ hardcode ไว้จะกลายเป็นลิงก์เสียภายในไม่กี่เดือน

### ทดสอบว่า Gate ทำงาน
1. แก้ threshold ให้เข้มเกินจริงชั่วคราว เช่น `p(95)<1`
2. push แล้วดูว่า job `performance` แดง
3. undo

---

## ขั้นตอนที่ 4 — วิเคราะห์ด้วย AI อย่างถูกวิธี (15 นาที)

ให้ AI ช่วยหาสาเหตุ **หลังจากมีข้อมูลแล้วเท่านั้น**:

```
Here is the k6 summary for our staging environment:
[วาง output]

Here are 10 structured log lines from the slowest requests:
[วาง log]

Here is the handler code for that endpoint:
[วาง code]

Where is the time going? List the top 3 likely causes ranked by evidence,
and tell me exactly which measurement would confirm or rule out each one.
```

บันทึกใน `docs/performance-report.md`:
```markdown
## AI Analysis
- AI เสนอสาเหตุ: 1) ... 2) ... 3) ...
- เรารับ: [ข้อไหน] เพราะหลักฐาน [อะไร]
- เราไม่รับ: [ข้อไหน] เพราะ [เหตุผล — เช่น AI ไม่รู้ว่าเรามี cache อยู่แล้ว]
- การวัดที่จะทำเพิ่มเพื่อยืนยัน: [อะไร]
```

---

## Artifacts ที่ต้องส่ง

| Artifact | รายละเอียด | ที่ส่ง |
|---|---|---|
| `performance/load-test.js` | k6 script พร้อม stages, tags และ thresholds | GitHub repo |
| `performance/baseline.json` | Summary export ของ baseline run | GitHub repo |
| `docs/performance-report.md` | Hypothesis vs actual + bottleneck + AI analysis | GitHub repo |
| Structured logging code | Request + business event logging พร้อม requestId และ redact | GitHub repo |
| CI job `performance` | ต่อเข้า pipeline แล้ว | GitHub repo |

### เกณฑ์ผ่าน
- [ ] k6 test รันได้กับ staging URL และมี think time (`sleep`) ระหว่าง request
- [ ] มี thresholds ที่ทำให้ exit code ≠ 0 เมื่อไม่ผ่าน (ทดสอบแล้ว)
- [ ] Performance report ระบุ bottleneck พร้อมตัวเลข ไม่ใช่ความรู้สึก
- [ ] Application logs ออกเป็น JSON มี `event`, `requestId`, `duration_ms`
- [ ] ไม่มี email / token / password หลุดออกมาใน log
