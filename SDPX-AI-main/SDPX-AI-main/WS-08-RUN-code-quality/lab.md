# Lab: Refactoring, Security & the Quality Loop

## เวลา: 1.5 ชั่วโมง
## เป้าหมาย
Refactor code จริงโดยใช้ test harness เป็นตาข่ายนิรภัย, ปิดช่องโหว่ security ที่พบ, และเขียน ADR

## 🎯 ทำ lab นี้แล้วได้ทักษะอะไร

| สิ่งที่จะทำได้ | ใช้ในงานจริงอย่างไร |
|---|---|
| refactor จริงโดยไม่แตะไฟล์ test เลย | เป็นตัวชี้วัดที่ชัดที่สุดว่าเข้าใจว่า test มีไว้ทำอะไร |
| เขียน characterization test สำหรับ code ที่ยังไม่มี test | เป็นเทคนิคมาตรฐานสำหรับเข้าไปแก้ระบบเก่าที่ไม่มีใครกล้าแตะ |
| ปิดช่องโหว่ security พร้อมเขียน test กันไม่ให้กลับมา | security fix ที่ไม่มี test คุ้มครองจะกลับมาใหม่ภายในไม่กี่เดือน |
| บันทึกการตัดสินใจเชิงสถาปัตยกรรมเป็นเอกสาร | เป็นงานที่ senior engineer ถูกคาดหวังให้ทำเป็น |

---

## 📦 ของที่ต้องมีอยู่แล้วก่อนเริ่ม lab

lab นี้ **ไม่เริ่มจากศูนย์** — มันต่อยอดจากงานใน `WS-08--before` ทันที
ถ้าแถวไหนยังว่าง ให้จัดการแถวนั้นก่อนเป็นอย่างแรก แล้วค่อยไล่ขั้นตอนตามปกติ

| ต้องมี | จะถูกใช้ที่ | ถ้ายังไม่มี |
|---|---|---|
| ผล AI review ทั้ง codebase | lab ขั้นตอนที่ 1 — ตัดสินทีละข้อว่ารับ / ไม่รับ / เลื่อน | ต้องรอ AI review สด ซึ่งกินเวลาและได้ผลตื้นกว่า |
| `docs/security-pre-check.md` พร้อมผล Dependabot / CodeQL / secret scanning | lab ขั้นตอนที่ 3 — แก้ช่องโหว่จริงอย่างน้อย 2 ข้อจากรายการนี้ | ไม่มีรายการช่องโหว่ให้แก้ และจะเดาเอาเองว่าอะไรเสี่ยง |
| ผลตรวจ secret ใน git history | lab ขั้นตอนที่ 3 — checklist ข้อสุดท้าย | ถ้ามี secret หลุดจริง จะไม่มีใครรู้จนสาย |
| รายชื่อ OWASP Top 10 ข้อที่เกี่ยวกับ project มากที่สุด 3 ข้อ | lecture หัวข้อ 4 และ lab ขั้นตอนที่ 3 | ไล่ security แบบทั่วไป แทนที่จะไล่จากความเสี่ยงจริงของระบบตัวเอง |

**แผนสำรองเมื่อของไม่ครบ:** จับคู่กับเพื่อนที่ทำมาแล้ว ใช้เครื่องของเขาเดินต่อ
แล้วตามเก็บงานของตัวเองหลังคาบ — สิ่งที่ห้ามทำคือให้ทั้งกลุ่มหยุดรอคนเดียว

---

## ขั้นตอนที่ 1 — Full Codebase Review (20 นาที)

### ให้ AI review ทั้ง codebase
```
Read AGENTS.md and memory-bank/ first so you understand the project's constraints.

Review this codebase and provide a prioritized refactoring plan.
For each issue found:
- File and approximate line number
- Type of code smell
- Impact if left unfixed: High/Medium/Low
- Suggested fix (the smallest change that removes the problem)

Do not suggest new design patterns unless the current code has a concrete
problem they solve. Sort by impact (High first).
```

สร้าง `docs/refactoring-plan.md`:
```markdown
# Refactoring Plan

## High Priority
1. [file:line]: [issue] — [why it's a problem]

## Medium Priority
...

## What AI Suggested vs What We'll Do
| AI เสนอ | ตัดสินใจ | เหตุผล |
|---|---|---|
| | รับ / ไม่รับ / เลื่อน | |

## สิ่งที่ AI มองไม่เห็น (เราเห็นเอง)
- [ปัญหาที่ต้องรู้ business context ถึงจะเห็น]
```

section สุดท้ายคือส่วนที่แสดงว่าคุณอ่าน code เอง ไม่ใช่แค่ส่งต่อคำตอบของ AI

---

## ขั้นตอนที่ 2 — Refactor ด้วย Quality Loop (40 นาที)

### เลือก Module ที่จะแก้
ใช้ function ที่กลุ่มเลือกไว้ตอนวอร์มอัพใน self-learning — อันที่คิดว่าแย่ที่สุด

**ขั้นตอนบังคับ ห้ามข้าม:**

**Step 1 — ยืนยันว่ามีตาข่ายก่อน**
```bash
pytest tests/unit/test_[module].py -v      # หรือ npm test
```
- test เขียว → ไปต่อได้
- **ไม่มี test → เขียน test ก่อน** ให้ครอบคลุม behavior ปัจจุบัน (ไม่ใช่ behavior ที่อยากได้)

> เทคนิค: ให้ AI ช่วยเขียน "characterization test" —
> test ที่บันทึกพฤติกรรมปัจจุบันไว้ตามที่มันเป็น แม้พฤติกรรมนั้นจะดูแปลก
> จุดประสงค์คือจับการเปลี่ยนแปลง ไม่ใช่ตัดสินถูกผิด

**Step 2 — Refactor ทีละก้าว**
```bash
# refactor เล็ก ๆ แล้ว run test ทันที
# อย่า refactor ทีเดียว 100 บรรทัดแล้วค่อย test

git add -p     # stage ทีละ change
pytest -q      # ต้องเขียวก่อนไปก้าวถัดไป
```

**ถ้าใช้ AI ช่วย refactor ให้กำหนดขอบเขต:**
```
Refactor only the function `process_booking` in src/services/booking.py.

Constraints:
- Do not change its public signature or observable behavior.
- Run `pytest tests/unit/test_booking.py` after each change and keep it green.
- Make at most 3 changes, then stop and show me the diff.
- Do not modify any test file.
```
บรรทัด "Do not modify any test file" สำคัญที่สุด — ไม่งั้น agent อาจ "แก้ให้เขียว"
ด้วยการแก้ test ซึ่งทำลายตาข่ายนิรภัยทั้งหมด

**Step 3 — Document Before/After**

สร้าง `docs/refactoring-[module].md`:
```markdown
## Function: [function_name]

### Before
[code เดิม]

### Issues Found
- Long method: ทำ 4 หน้าที่ในที่เดียว
- Magic number: 8 และ 150 ไม่มี context

### After
[code ใหม่]

### What AI Suggested
- Extract 6 methods → เราทำ 3 (อีก 3 อันเล็กเกินไป ไม่คุ้ม)
- Add Repository pattern → skip เพราะ overkill สำหรับขนาดนี้

### Tests Result
- Before: 5 tests pass
- After: 5 tests pass (+ 2 tests เพิ่มระหว่าง refactor)
- จำนวนครั้งที่ต้อง revert เพราะ test แดง: [ตัวเลข]
```

---

## ขั้นตอนที่ 3 — ปิดช่องโหว่ Security (15 นาที)

เปิด `docs/security-pre-check.md` ที่ทำมาจาก homework แล้วลงมือแก้อย่างน้อย 2 ข้อ

### Checklist ที่ต้องไล่ให้ครบ
- [ ] Query ทุกที่ใช้ parameterized ไม่มี string concatenation
- [ ] ทุก endpoint ที่แก้/ลบข้อมูล ตรวจ **ownership** ไม่ใช่แค่ login
- [ ] Response ไม่ส่ง field ที่ไม่ควรออก (`password_hash`, internal id)
- [ ] Error response ไม่มี stack trace หรือ connection string
- [ ] `/api/test/seed` และ `/api/test/cleanup` ปิดใน production แล้ว
- [ ] Log ไม่มี email / token / password (ตรวจของจริงจาก WS-07)
- [ ] Dependabot alerts ที่ severity High/Critical จัดการแล้วหรือมีเหตุผลว่าทำไมยัง
- [ ] ไม่มี secret ใน git history — ถ้ามี revoke แล้ว

บันทึกสิ่งที่แก้ลงท้าย `docs/security-pre-check.md`:
```markdown
## Fixed in WS-08
| ปัญหา | ไฟล์ | วิธีแก้ | test ที่คุ้มครองไม่ให้กลับมา |
|---|---|---|---|
```

คอลัมน์สุดท้ายสำคัญ — ทุก security fix ควรมี test คู่กัน
ไม่งั้นอีกสองเดือนมันจะกลับมาใหม่โดยไม่มีใครรู้

---

## ขั้นตอนที่ 4 — เขียน ADR (15 นาที)

สร้าง `docs/adr/ADR-001-[topic].md`:
```markdown
# ADR-001: [Title]

## Status
Accepted

## Date
[วันที่]

## Context
[background — constraint อะไรบ้าง ทั้งเรื่อง technical, เวลา, และทักษะของทีม]

## Decision
[การตัดสินใจที่เลือก]

## Alternatives Considered
1. [Alternative A] — ไม่เลือกเพราะ [reason]
2. [Alternative B] — ไม่เลือกเพราะ [reason]

## Consequences
### Positive
- [ข้อดี]

### Negative / Trade-offs
- [ข้อเสียหรือ trade-off ที่ยอมรับ]

## Revisit When
[เงื่อนไขที่จะทำให้ต้องกลับมาทบทวน ADR นี้]

## AI-DLC Note
AI proposed: [Option A] เพราะ [reason]
Human decided: [Option B] เพราะ [context ที่ AI ไม่รู้]
```

### ใช้ AI สำรวจทางเลือก (ไม่ใช่ให้มันตัดสินใจ)
```
What are the realistic options for [decision] in a university [domain] system with:
- team of [N] students, [skill level]
- [constraints from memory-bank/standards/tech-stack.md]
- must run on [platform]

For each option give: pros, cons, and what would make it the wrong choice here.
Do not recommend one — I will decide.
```

**ตัวอย่าง topics:**
- Database choice (PostgreSQL vs SQLite vs MongoDB)
- Authentication strategy (JWT vs session)
- API design (REST vs GraphQL)
- State management (server-side vs client-side)
- Deployment strategy (monolith vs microservices)

เลือก 1 topic ที่กลุ่ม **ตัดสินใจไปแล้วจริง ๆ** ในวิชานี้ แล้วบันทึกย้อนหลังให้ครบ

---

## Artifacts ที่ต้องส่ง

| Artifact | รายละเอียด | ที่ส่ง |
|---|---|---|
| `docs/refactoring-plan.md` | Full review + สิ่งที่รับ/ไม่รับจาก AI | GitHub repo |
| Refactored code | Module ที่ refactor + test ยังเขียว | GitHub repo |
| `docs/refactoring-[module].md` | Before/after + AI vs team decisions | GitHub repo |
| `docs/security-pre-check.md` | ผล scan + สิ่งที่แก้ + test ที่คุ้มครอง | GitHub repo |
| `docs/adr/ADR-001-*.md` | ADR 1 ฉบับ ครบทุก section | GitHub repo |

### เกณฑ์ผ่าน
- [ ] Test เขียวทั้งหมดหลัง refactor (และ CI ก็เขียว)
- [ ] ไม่มีไฟล์ test ถูกแก้ระหว่าง refactor (ตรวจด้วย `git diff --stat` บน branch)
- [ ] Refactoring plan ระบุชัดว่าเห็นด้วย/ไม่เห็นด้วยกับ AI ตรงไหน พร้อมเหตุผล
- [ ] แก้ security issue อย่างน้อย 2 ข้อ และมี test คุ้มครอง
- [ ] ADR ครบทุก section โดยเฉพาะ Alternatives Considered
- [ ] ทุกคนในกลุ่มอธิบาย refactoring decisions ได้
