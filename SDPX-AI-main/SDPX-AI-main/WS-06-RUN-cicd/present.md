# Present: CI/CD & Integration Loop

## เวลา: 1 ชั่วโมง (6 กลุ่ม × 10 นาที)
## รูปแบบ: อาจารย์ random 1 คนจากกลุ่ม

## 🎯 การ present นี้ฝึกอะไร

| สิ่งที่จะทำได้ | ใช้ในงานจริงอย่างไร |
|---|---|
| อธิบายว่าแต่ละบรรทัดใน workflow ป้องกันอะไร | ตอนถูกขอให้ review workflow ของคนอื่น คุณจะรู้ว่าต้องดูอะไร |
| demo ว่า test แดงทำให้ merge ถูกบล็อกจริง | พิสูจน์ระบบด้วยการทำให้มันล้มเหลว ไม่ใช่แค่ทำให้มันสำเร็จ |
| ระบุคอขวดของ pipeline พร้อมแผนลดเวลา | การรอ pipeline คือเวลาที่ทั้งทีมเสียพร้อมกัน — ทีมจริงตั้งงบเวลาไว้ |
| ตอบคำถามเรื่องการจัดการ secret ได้อย่างมั่นใจ | เป็นหัวข้อที่ถูกถามเสมอทั้งใน security review และในสัมภาษณ์ |

---

## สิ่งที่ต้อง Present (10 นาที/กลุ่ม)

### Demo (5 นาที)
1. เปิด GitHub Actions และแสดง successful pipeline run
2. คลิกเข้าไปดูแต่ละ job และ steps พร้อมบอกว่า job ไหนใช้เวลานานที่สุด
3. แสดง branch protection / ruleset settings
4. แสดง screenshot (หรือ demo สด) ว่า failing test ทำให้ merge ถูกบล็อก
5. เปิด `docs/loop-metrics.md` แสดงตัวเลข before/after

### คำถาม (5 นาที)
อาจารย์อาจถาม:
- "ถ้า E2E test fail แต่ unit test ผ่าน จะเกิดอะไร"
- "ทำไมใช้ `npm ci` แทน `npm install`"
- "Secrets ที่ใช้ใน workflow มีอะไรบ้าง เก็บไว้ที่ไหน และถ้าหลุดจะทำอะไรก่อน"
- "`permissions: contents: read` ป้องกันอะไร"
- "`concurrency` กับ `cancel-in-progress` ช่วยอะไร"
- "Pipeline ช้าที่สุดตรงไหน จะทำให้เร็วขึ้นอย่างไรโดยไม่ลด coverage"
- "วันนี้ push ไปกี่ครั้งกว่า pipeline จะเขียว — ครั้งหน้าจะลดยังไง"

---

## Rubric (5 คะแนน)

| เกณฑ์ | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| **Pipeline ครบ** | แค่ 1 job | lint หรือ test | lint + test | lint + typecheck + test + E2E | + build + deploy staging + artifacts |
| **Secrets & Supply Chain** | hardcode | env vars ธรรมดา | GitHub Secrets | + `permissions:` จำกัดสิทธิ์ | + ไม่ echo secret + pin action version + secret scanning เปิด |
| **Branch Protection** | ไม่มี | มีแต่ไม่ require CI | require CI | + require review | + พิสูจน์แล้วว่าบล็อกจริง + production ต้อง approve |
| **Loop Metrics** | ไม่ได้วัด | มีตัวเลขบางส่วน | มี before/after | + ระบุคอขวดได้ | + มีแผนลดเวลาที่เป็นรูปธรรม |
| **Pipeline Speed** | > 10 นาที | 5–10 นาที | 3–5 นาที | 2–3 นาที | < 2 นาที (cache + concurrency + job ขนาน) |

**คะแนนเต็ม: 5 คะแนน** (เฉลี่ยจาก 5 เกณฑ์)

---

## หมายเหตุสำหรับอาจารย์
- คำถาม "push กี่ครั้งกว่าจะเขียว" ไม่ได้ต้องการตัวเลขต่ำ แต่ต้องการให้นักศึกษาเห็นว่า
  การ debug ผ่าน CI คือการทำงานใน loop ที่ latency สูงกว่า local หลายสิบเท่า
