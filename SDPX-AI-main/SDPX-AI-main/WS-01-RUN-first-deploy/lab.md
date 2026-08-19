# Lab: Setup, First Deployment & Closing the Deploy Loop

## เวลา: 1 ชั่วโมง
## รูปแบบ: ไม่มีการตรวจ — กลุ่มช่วยกันเอง
## เป้าหมาย
- ทุกคนมี dev environment ที่ทำงานได้
- **ปิด Deploy Loop ให้ครบ**: commit → build → deploy → เห็น URL จริง และวัดเวลาได้
- สร้าง `AGENTS.md` และ `memory-bank/standards/tech-stack.md` — context ชุดแรกของ project

## 🎯 ทำ lab นี้แล้วได้ทักษะอะไร

| สิ่งที่จะทำได้ | ใช้ในงานจริงอย่างไร |
|---|---|
| ปิด deploy loop ได้ครบวง และวัด commit-to-live time เป็นตัวเลข | lead time คือหนึ่งใน 4 ตัวชี้วัดที่ทีมซอฟต์แวร์ทั่วโลกใช้วัดตัวเอง (DORA) |
| ตั้ง auto-deploy จาก branch ได้ | งาน deploy ที่ยังต้องกดปุ่มเองคือจุดที่เกิดความผิดพลาดของมนุษย์มากที่สุด |
| เขียน `AGENTS.md` และ `tech-stack.md` ที่ทั้งคนและ AI ใช้ได้ | เอกสารที่เขียนให้เครื่องอ่าน มักกลายเป็นเอกสารที่คนใหม่ในทีมอ่านแล้วเข้าใจเร็วที่สุดด้วย |
| ตั้ง `.gitignore` และ `.env.example` ให้ถูกตั้งแต่ commit แรก | ป้องกันปัญหา secret หลุดซึ่งเป็นเรื่องที่แก้ย้อนหลังไม่ได้ |

---

## 📦 ของที่ต้องมีอยู่แล้วก่อนเริ่ม lab

lab นี้ **ไม่เริ่มจากศูนย์** — มันต่อยอดจากงานใน `WS-01--before` ทันที
ถ้าแถวไหนยังว่าง ให้จัดการแถวนั้นก่อนเป็นอย่างแรก แล้วค่อยไล่ขั้นตอนตามปกติ

| ต้องมี | จะถูกใช้ที่ | ถ้ายังไม่มี |
|---|---|---|
| screenshot version ของ tools ทั้ง 5 ตัว | ยืนยันหน้าคาบว่าเครื่องพร้อมเข้า lab | อาจารย์จะไม่รู้ว่าใครติดปัญหา จนกระทั่งสายเกินแก้ในคาบ |
| repo แรก + commit แรกของตัวเอง | lab ขั้นตอนที่ 2 — สร้าง repo ของกลุ่ม โดยไม่ต้องสอน git ซ้ำ | ทั้งกลุ่มต้องรอคนที่ยังไม่เคยใช้ git |
| `LOOP_NOTES.md` — จำนวนรอบที่ AI วนกว่า test จะเขียว | lecture หัวข้อ 2 — เอาตัวเลขจริงของนักศึกษามาคุยเรื่อง Loop Engineering | ฟังเรื่อง loop แบบนามธรรม แทนที่จะเห็นจากข้อมูลของตัวเอง |
| นิสัยไม่ commit ไฟล์ `.env` | lab ขั้นตอนที่ 4 — ตั้ง `.gitignore` และ `.env.example` | เสี่ยงทำ secret หลุดตั้งแต่ commit แรกของ project จริง |

**แผนสำรองเมื่อของไม่ครบ:** จับคู่กับเพื่อนที่ทำมาแล้ว ใช้เครื่องของเขาเดินต่อ
แล้วตามเก็บงานของตัวเองหลังคาบ — สิ่งที่ห้ามทำคือให้ทั้งกลุ่มหยุดรอคนเดียว

---

## ขั้นตอนที่ 1 — เลือก Domain และ Stack (10 นาที)

### เลือก Domain
ทุกกลุ่มเลือกงานจาก `project-ideas/`

### เลือก Stack
- **Next.js** — full-stack TypeScript แนะนำถ้าไม่แน่ใจ
- **FastAPI + React** — Python backend, JavaScript frontend

เลือกแล้วห้ามเปลี่ยนกลางคัน โดยไม่เขียน ADR (WS-08)

---

## ขั้นตอนที่ 2 — สร้าง Repository (10 นาที)

```bash
# สมาชิกคนที่ 1: สร้าง repo บน GitHub
# ชื่อ: sdpx-[groupname]
# Visibility: Public, เพิ่ม README + .gitignore

# ทุกคน: clone และ setup
git clone https://github.com/[org]/sdpx-[groupname].git
cd sdpx-[groupname]

# สร้าง develop branch
git switch -c develop
git push -u origin develop
```

### สร้าง structure สำหรับ context
```bash
mkdir -p memory-bank/standards
mkdir -p memory-bank/units
```

---

## ขั้นตอนที่ 3 — เขียน Context ให้ AI (15 นาที)

### 3.1 `AGENTS.md` ที่ root ของ repo

ไฟล์นี้คือสิ่งที่ AI agent อ่านทุกครั้งที่เปิด repo — เขียนให้เครื่องอ่าน ไม่ใช่ให้คนประทับใจ

```markdown
# AGENTS.md

## Project
[1 บรรทัดว่าระบบนี้ทำอะไรให้ใคร] — รายละเอียดดู memory-bank/intent.md

## Setup & Commands
- install: `npm ci`            (หรือ `pip install -r requirements.txt`)
- dev:     `npm run dev`
- test:    `npm test`
- lint:    `npm run lint`
- build:   `npm run build`

## Conventions
- ภาษา: [TypeScript strict / Python 3.12 + type hints]
- ใช้ `data-testid` กับ element ที่ test จะอ้างถึง
- Commit ตาม Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`)
- Branch: ทำงานบน `feature/*` แล้ว PR เข้า `develop`

## Rules for agents
- ต้องรัน test ให้เขียวก่อนเสนอ diff เสมอ
- ถ้า test แดง ให้แก้ code — ห้ามแก้หรือลบ test เพื่อให้ผ่าน
- ห้ามใส่ค่า secret ลงไฟล์ใด ๆ ใช้ env var เท่านั้น
- ห้ามแก้ `docs/adr/` และ `memory-bank/` โดยไม่ถามก่อน
- แก้ทีละเรื่อง — diff ที่เกิน ~200 บรรทัดให้หยุดถามก่อน
```

### 3.2 `memory-bank/standards/tech-stack.md`

```markdown
# Tech Stack

## Decision Summary
ทีม: [ชื่อสมาชิก]
Domain: [ชื่อ domain]
Date: [วันที่]

## Frontend
- Framework: [Next.js / React]
- Language: TypeScript
- Styling: Tailwind CSS
- Rationale: [ทำไมถึงเลือก]

## Backend
- Framework: [Next.js Route Handlers / FastAPI]
- Language: [TypeScript / Python 3.12]
- Rationale: [ทำไมถึงเลือก]

## Database
- [PostgreSQL / SQLite / TBD]
- Rationale: [ทำไมถึงเลือก]

## Deployment
- Platform: [Vercel / Render]
- Staging URL: [จะเพิ่มหลัง deploy]
- Commit-to-live time: [จะวัดในขั้นตอนที่ 5]

## AI Tools
- Agent ที่ใช้: [Copilot / Claude Code / Gemini CLI / อื่น ๆ]
- Review policy: ทุก AI-generated code ต้องอ่านและอธิบายได้ก่อน commit
```

> **Context Engineering Note:** `AGENTS.md` = กติกาและคำสั่ง (เครื่องอ่าน)
> `memory-bank/` = เหตุผลและการตัดสินใจ (คนกับ AI อ่านร่วมกัน)
> แยกกันเพราะสองอย่างนี้เปลี่ยนคนละจังหวะ

---

## ขั้นตอนที่ 4 — Scaffold และ Deploy (20 นาที)

### Scaffold ด้วย AI
```
Read AGENTS.md and memory-bank/standards/tech-stack.md first.

I am building a [domain] system for a university.
Create a simple landing page that shows the service name,
a navigation bar, and a placeholder for the main feature.
Add data-testid to the nav and the main CTA.
Keep it clean and simple — no extra dependencies.
```

**ก่อน commit:** ทุกคนอ่าน code ที่ AI generate และอธิบายให้เพื่อนฟังได้
ถ้ามีบรรทัดที่ไม่มีใครอธิบายได้ — ลบทิ้งหรือถาม AI ให้อธิบายจนเข้าใจ

### Deploy
**Vercel (Next.js):** vercel.com → Add New Project → Import repo → Deploy

**Render (FastAPI):** render.com → New Web Service → Connect repo
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

ตั้งให้ deploy อัตโนมัติเมื่อ push เข้า `develop` — ถ้าต้องกดปุ่มเอง loop ยังไม่ปิด

---

## ขั้นตอนที่ 5 — วัด Deploy Loop (5 นาที)

ทดลองแก้ของเล็ก ๆ แล้วจับเวลา:

```bash
# แก้ข้อความบนหน้าแรก 1 บรรทัด
git add -A
git commit -m "feat: update landing headline"
git push               # ← เริ่มจับเวลาตรงนี้
# refresh URL จนกว่าจะเห็นข้อความใหม่   ← หยุดจับเวลาตรงนี้
```

บันทึกลงใน `memory-bank/standards/tech-stack.md`:
```markdown
## Deployment
- Staging URL: [URL ที่ได้จาก Vercel/Render]
- Commit-to-live time: X นาที Y วินาที (วัดเมื่อ WS-01)
```

**คุยกันในกลุ่ม 2 นาที:**
- ตอนนี้ loop เรามีขั้น Verify อะไรบ้าง (คำตอบตอนนี้คือ "ตาคน" อย่างเดียว)
- ถ้า deploy ตัวนี้พัง เราจะรู้ตอนไหน
- สัปดาห์หน้าเราจะเริ่มเติมด่านตรวจอัตโนมัติเข้าไปใน loop นี้

---

## สร้าง .gitignore ที่ครอบคลุม

```
.env
.env.*
!.env.example
node_modules/
__pycache__/
.venv/
.next/
dist/
coverage/
playwright-report/
test-results/
*.log
.DS_Store
```

เพิ่ม `.env.example` ที่มีแต่ชื่อ key ไม่มีค่า — เพื่อให้คนอื่น (และ AI) รู้ว่าต้องตั้ง env อะไรบ้าง

---

## Artifacts ที่ต้องส่ง

| Artifact | รายละเอียด | ที่ส่ง |
|---|---|---|
| GitHub Repository URL | Public repo | ส่ง link ใน LMS |
| Live URL | App ที่ deploy แล้ว | ส่ง link ใน LMS |
| `AGENTS.md` | ครบทุก section รวม Rules for agents | ใน repo |
| `memory-bank/standards/tech-stack.md` | ครบทุก section + commit-to-live time | ใน repo |
| `.env.example` | ชื่อ key อย่างเดียว ไม่มีค่า | ใน repo |

### เกณฑ์ผ่าน (ตรวจกันเองในกลุ่ม)
- [ ] Live URL เปิดได้จาก browser ของทุกคน
- [ ] ทุกคน clone และ run local ได้เอง
- [ ] push เข้า `develop` แล้ว deploy เองอัตโนมัติ (ไม่ต้องกดปุ่ม)
- [ ] จด commit-to-live time ไว้แล้ว
- [ ] `AGENTS.md` มีข้อ "ห้ามแก้ test เพื่อให้ผ่าน"
- [ ] ไม่มี `.env` หรือ secrets ใน repo
