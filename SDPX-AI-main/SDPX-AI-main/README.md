# SDPX-AI

**Software Development Process in Practice — AI-Assisted**

วิชานี้สอน *กระบวนการ* พัฒนาซอฟต์แวร์ในยุคที่ AI agent เขียน code ได้เองแล้ว
สิ่งที่ทำให้วิศวกรซอฟต์แวร์มีค่าจึงไม่ใช่ความเร็วในการพิมพ์ code
แต่คือความสามารถในการ **ออกแบบวงจรที่ทำให้รู้เร็วที่สุดว่าอะไรถูกอะไรผิด**

---

## แนวคิดหลักของวิชา: Loop Engineering

> **Loop Engineering** = การออกแบบวงจร feedback ให้ **สั้น เชื่อถือได้ และรันซ้ำได้**
> เพื่อให้ทั้งมนุษย์และ AI agent รู้ให้เร็วที่สุดว่าสิ่งที่เพิ่งทำไปนั้นถูกหรือผิด

```
   ┌──────────────────────────────────────────────┐
   ↓                                              │
Context ──→ Plan ──→ Act ──→ Verify ──→ Feedback ─┘
(รู้อะไร)  (จะทำ)  (ลงมือ)  (ตรวจ)    (แก้/เรียนรู้)
```

Loop หนึ่งวัดกันที่ 3 อย่าง — ทุกสัปดาห์เราจะพยายามทำให้ทั้งสามดีขึ้น

| คุณสมบัติ | คำถาม | ตัวอย่างที่แย่ | ตัวอย่างที่ดี |
| :--- | :--- | :--- | :--- |
| **Latency** | กว่าจะรู้ผลใช้เวลาเท่าไร | รอ user แจ้ง bug 3 วันให้หลัง | unit test เขียว/แดงใน 2 วินาที |
| **Fidelity** | signal บอกความจริงแค่ไหน | test ที่ผ่านตลอดไม่ว่า code จะพังแค่ไหน | test ที่แดงทันทีเมื่อลบ business rule |
| **Coverage** | จับความผิดพลาดได้กี่แบบ | ตรวจแค่ happy path | ตรวจ error case + integration + performance |

**ทำไมเรื่องนี้สำคัญมากขึ้นในยุค AI:** AI agent ทำงานเป็น loop อยู่แล้ว —
มันอ่าน context, เสนอแผน, แก้ code, รัน test, อ่าน error, แล้วแก้ใหม่
ดังนั้น **คุณภาพของ agent ถูกจำกัดด้วยคุณภาพของขั้น Verify ที่เราสร้างให้มัน**
ถ้าไม่มีสัญญาณที่เชื่อถือได้ AI ก็ได้แค่เดาให้ดูดี — วิชานี้จึงลงทุนหนักกับ test และ automation

---

## Loop ที่จะสร้างทีละชั้น

```
WS-08  Quality Loop        review → refactor → verify → ADR
WS-07  Production Loop     measure → analyze → optimize → measure
WS-06  Integration Loop    CI/CD รวมทุก loop ให้เป็น gate เดียว
WS-05  Environment Loop    compose up แล้วได้ผลเหมือนกันทุกเครื่อง
WS-04  Acceptance Loop     user journey → E2E → report   [E2E Test Harness]
WS-03  Unit Test Loop      red → green → refactor        [Unit Test Harness]
WS-02  Spec Loop           intent → story → API contract → review
WS-01  Deploy Loop         commit → build → deploy → เห็นของจริงบน URL
```

> **Test Harness** คือคำเฉพาะของฝั่ง testing — หมายถึงโครงสร้างรอบ ๆ test
> (test doubles, fixtures, factories, seed data, page objects) ที่ทำให้ test รันซ้ำได้ผลเดิม
> ใช้คำนี้เฉพาะใน WS-03 และ WS-04 เท่านั้น สัปดาห์อื่นเรียกว่า *loop*

---

## Course Outline

| Week | Topic | Loop ที่ได้ | Before Class | At Class |
| :--- | :--- | :--- | :--- | :--- |
| 01 | Introduction | — | | |
| 02 | IT Project Management 101 | — | | |
| 03 | First Deploy + Loop Engineering | Deploy Loop | WS-01--before | WS-01-RUN |
| 04 | Analysis and Design | Spec Loop | WS-02--before | WS-02-RUN |
| 05 | Software Testing | — | | |
| 06 | *Midterm Exam* | — | | |
| 07 | Unit Testing | Unit Test Loop | WS-03--before | WS-03-RUN |
| 08 | End-to-End Testing | Acceptance Loop | WS-04--before | WS-04-RUN |
| 09 | Software Architecture | — | | |
| 10 | Docker | Environment Loop | WS-05--before | WS-05-RUN |
| 11 | CI/CD | — | | |
| 12 | CI/CD | Integration Loop | WS-06--before | WS-06-RUN |
| 13 | Performance Testing | Production Loop | WS-07--before | WS-07-RUN |
| 14 | Code Quality | Quality Loop | WS-08--before | WS-08-RUN |
| 15 | Presentation | — | | |
| 16 | Summary | — | | |
| 17 | *Final Exam* | — | | |

---

## โครงสร้างของแต่ละ Workshop

```
WS-0X--before/
├── self-learning.md   ← ดู/อ่านมาก่อนเข้าห้อง + checklist เช็คตัวเอง
└── homework.md        ← งานที่ต้องเสร็จก่อนเข้าห้อง

WS-0X-RUN-*/
├── lecture.md         ← 30–45 นาที เน้นเฉพาะจุดที่ self-learning ไม่ได้ตอบ
├── lab.md             ← 1–1.5 ชั่วโมง ลงมือทำกับ project ของกลุ่มจริง
└── present.md         ← 1 ชั่วโมง present + oral defense + rubric
```

### ลำดับที่ห้ามสลับ

`WS-0X--before` เป็น **เงื่อนไขก่อนเข้าคาบ** ไม่ใช่ของเสริม —
เนื้อหาในห้องเริ่มจากจุดที่ `--before` จบ และงานใน `homework.md`
คือวัตถุดิบที่ `lab.md` หยิบมาใช้ต่อทันที

```
self-learning ──→ homework ──→ lecture ──→ lab ──→ present
   อ่าน/ดู        ทำของจริง     อธิบายจุด    ใช้ของที่     อธิบายและ
   มาก่อน         มาก่อน       ที่ยังติด     เตรียมมา     ป้องกันงาน
```

ทุกไฟล์ในชุดนี้จึงมีตารางกำกับว่า **สิ่งที่เตรียมมาจะถูกใช้ตรงไหน**
และ **ถ้าไม่ได้เตรียมมาจะติดตรงไหน** — ดูหัวข้อ 🔗 ใน `--before`
และหัวข้อ ✅ / 📦 ในไฟล์ฝั่ง `RUN`

---

## Artifacts ที่จะสะสมตลอดวิชา

```
repo ของกลุ่ม
├── AGENTS.md                          ← WS-01: context ที่ AI agent อ่านทุกครั้ง
├── memory-bank/
│   ├── intent.md                      ← WS-02: "ทำไมเราถึงสร้างสิ่งนี้"
│   ├── units/[unit]/unit-brief.md     ← WS-02: ขอบเขตของแต่ละ module
│   └── standards/tech-stack.md        ← WS-01: การตัดสินใจเรื่องเครื่องมือ
├── docs/
│   ├── openapi.yaml                   ← WS-02: API contract
│   ├── adr/ADR-00X-*.md               ← WS-08: architecture decisions
│   └── performance-report.md          ← WS-07: baseline + วิเคราะห์
├── tests/                             ← WS-03, WS-04: test harness
├── Dockerfile, compose.yaml           ← WS-05
└── .github/workflows/ci.yml           ← WS-06
```

---

## กติกาสำคัญของวิชา

1. **AI เสนอ — คนตัดสิน** ทุก artifact ที่ AI สร้าง ต้องมีคนในกลุ่มที่อธิบายได้
2. **ถ้าอธิบายไม่ได้ ห้าม commit** oral defense ระหว่าง present วัดข้อนี้โดยตรง
3. **ห้ามส่ง secret เข้า AI tool หรือเข้า repo** ไม่ว่ากรณีใด
4. **Verify ก่อนเชื่อ** ทั้ง output ของ AI และผลลัพธ์ของตัวเอง

---

## Scoring

- [40] Lab
- [10] Presentation
- [20] Midterm Exam
- [30] Final Exam
