# Lab: Docker & the Environment Loop

## เวลา: 1.5 ชั่วโมง
## เป้าหมาย
ทำให้ทั้ง app และ test suite รันได้ด้วย **คำสั่งเดียว** บนทุกเครื่องของสมาชิกในกลุ่ม

## 🎯 ทำ lab นี้แล้วได้ทักษะอะไร

| สิ่งที่จะทำได้ | ใช้ในงานจริงอย่างไร |
|---|---|
| ทำให้ทั้ง app และ test รันได้ด้วยคำสั่งเดียว | ลดเวลา onboarding คนใหม่จากเป็นวันเหลือเป็นนาที |
| แยก test database ให้เป็น ephemeral | ข้อมูลค้างจากการรันครั้งก่อนคือสาเหตุของผลทดสอบที่เชื่อไม่ได้ |
| พิสูจน์ว่า exit code สะท้อนผล test จริง | เป็นจุดที่ตัดสินว่า CI ในสัปดาห์หน้าจะเชื่อถือได้หรือไม่ |
| อัปเดตคำสั่งใน `AGENTS.md` ให้ agent รัน test ใน environment เดียวกับ CI | ทำให้ความเห็นของ AI ว่า "ผ่านแล้ว" มีน้ำหนักจริง |

---

## 📦 ของที่ต้องมีอยู่แล้วก่อนเริ่ม lab

lab นี้ **ไม่เริ่มจากศูนย์** — มันต่อยอดจากงานใน `WS-05--before` ทันที
ถ้าแถวไหนยังว่าง ให้จัดการแถวนั้นก่อนเป็นอย่างแรก แล้วค่อยไล่ขั้นตอนตามปกติ

| ต้องมี | จะถูกใช้ที่ | ถ้ายังไม่มี |
|---|---|---|
| Docker ที่ยืนยันแล้วว่ารันได้ | lab ขั้นตอนที่ 1 — build image ตัวแรกของ project | เริ่ม lab ไม่ได้เลย |
| GitHub Actions workflow เบื้องต้นที่รันเขียวแล้ว | WS-06 lab ขั้นตอนที่ 1 — ต่อยอดเป็น pipeline เต็ม | สัปดาห์หน้าต้องเริ่มจากศูนย์ และจะทำ 4 ขั้นตอนไม่ทัน |
| E2E test สำหรับกรณีที่ต้องล้มเหลว | lab ขั้นตอนที่ 3 — พิสูจน์ว่า test environment คืน exit code ที่ถูกต้อง | ไม่มีทางรู้ว่า pipeline จะแดงจริงตอนของพัง หรือเขียวหลอก |
| รายการขั้นตอน setup ปัจจุบันที่จดไว้ | lab ขั้นตอนที่ 2 — ตาราง Before/After ของ Environment Loop | วัดผลของสิ่งที่ทำในคาบนี้ไม่ได้ |

**แผนสำรองเมื่อของไม่ครบ:** จับคู่กับเพื่อนที่ทำมาแล้ว ใช้เครื่องของเขาเดินต่อ
แล้วตามเก็บงานของตัวเองหลังคาบ — สิ่งที่ห้ามทำคือให้ทั้งกลุ่มหยุดรอคนเดียว

---

## ขั้นตอนที่ 1 — สร้าง Dockerfile (25 นาที)

### ให้ AI ร่าง โดยระบุข้อกำหนดให้ครบ
```
Read AGENTS.md and package.json first.

Generate a multi-stage Dockerfile for this [Next.js / FastAPI] app with stages:
deps, build, test, runtime.

Requirements:
- Pin the base image tag (node:24-alpine or python:3.12-slim) — never `latest`
- Copy dependency manifests before source code (layer caching)
- Use `npm ci` (or `pip install -r requirements.txt --no-cache-dir`)
- Runtime stage installs production dependencies only (`npm ci --omit=dev`)
- Run as a non-root user
- Add a HEALTHCHECK hitting /api/health
- Add a one-line comment explaining each instruction
```

### Review ทุก Instruction
ก่อน commit ทุกคนในกลุ่มต้องตอบได้:
- `FROM node:24-alpine` — ทำไม alpine? ทำไมต้อง pin tag?
- `RUN npm ci` — ต่างจาก `npm install` อย่างไร?
- `--omit=dev` — ตัดอะไรออก และทำไมถึงสำคัญกับ production?
- `USER node` — ทำไมต้อง non-root?
- `HEALTHCHECK` — ต่างจาก "process ยังรันอยู่" อย่างไร?
- `EXPOSE 3000` — ทำหน้าที่อะไร (และไม่ได้ทำอะไร)?

### สร้าง .dockerignore
```
node_modules
.next
dist
coverage
playwright-report
test-results
.env
.env.*
*.log
.git
.github
```

### Build และทดสอบ
```bash
docker build -t campus-[domain]:dev .
docker run --rm -p 3000:3000 campus-[domain]:dev
# เปิด browser ตรวจว่า app ทำงานได้

# ดูขนาด image — เทียบกับตอนไม่ใช้ multi-stage
docker images campus-[domain]
```

---

## ขั้นตอนที่ 2 — compose.yaml สำหรับ Dev (20 นาที)

สร้าง `compose.yaml` (ไม่ต้องมี `version:`):
```yaml
services:
  app:
    build:
      context: .
      target: build          # dev ใช้ stage ที่มี devDependencies
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL:-postgres://user:pass@db:5432/appdb}
      NODE_ENV: development
    volumes:
      - .:/app               # hot reload สำหรับ dev
      - /app/node_modules    # ไม่ override node_modules ใน image
    command: npm run dev
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d appdb"]
      interval: 5s
      timeout: 5s
      retries: 5
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"          # expose สำหรับ local database tools

volumes:
  postgres_data:
```

### ทดสอบว่า Loop ปิดจริง
```bash
docker compose up            # ต้องเห็น app และ db รันพร้อมกัน

docker compose down
docker compose up            # ต้องรันได้ใหม่โดยไม่ต้อง setup อะไรเพิ่ม
```

**การทดสอบที่สำคัญที่สุด:** ให้สมาชิกที่ **ยังไม่เคยรัน project นี้บนเครื่องตัวเอง**
ลอง clone ใหม่แล้วรัน `docker compose up` — ถ้าติดอะไรแม้แต่ขั้นเดียว ให้แก้จนไม่ติด

จากนั้นอัปเดต `docs/setup-steps.md`:
```markdown
## Before (WS-05)
6 ขั้นตอน ~25 นาที

## After
1. `docker compose up`
→ 1 ขั้นตอน ~3 นาที (ครั้งแรก) / ~20 วินาที (ครั้งถัดไป)
```

---

## ขั้นตอนที่ 3 — Test Environment (25 นาที)

สร้าง `compose.test.yaml`:
```yaml
services:
  test-db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: testdb
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U testuser -d testdb"]
      interval: 3s
      retries: 10
    tmpfs:
      - /var/lib/postgresql/data    # ephemeral: อยู่ใน RAM หายเมื่อหยุด

  unit:
    build:
      context: .
      target: test
    environment:
      DATABASE_URL: postgres://testuser:testpass@test-db:5432/testdb
      NODE_ENV: test
    depends_on:
      test-db:
        condition: service_healthy
    command: npm test

  e2e:
    build:
      context: .
      target: build
    environment:
      DATABASE_URL: postgres://testuser:testpass@test-db:5432/testdb
      BASE_URL: http://app-test:3000
      NODE_ENV: test
    depends_on:
      test-db:
        condition: service_healthy
    command: npx playwright test
    profiles: ["e2e"]
```

### ทดสอบ Test Environment
```bash
# รัน unit tests ใน container
docker compose -f compose.test.yaml up unit \
  --abort-on-container-exit --exit-code-from unit
echo "Exit code: $?"     # 0 = pass, non-zero = fail

# cleanup
docker compose -f compose.test.yaml down -v
```

### ทดสอบว่า Exit Code เชื่อถือได้ (บังคับ)
```bash
# 1. แก้ test ตัวหนึ่งให้ fail ชั่วคราว
# 2. รันคำสั่งข้างบนอีกครั้ง
# 3. ต้องได้ exit code != 0
# 4. undo
```

> ถ้าขั้นนี้ยังได้ exit code 0 ทั้งที่ test แดง — pipeline ใน WS-06 จะเขียวหลอกทั้งเทอม
> นี่คือจุดที่ fidelity ของ loop ทั้งวงถูกกำหนด

---

## ขั้นตอนที่ 4 — เพิ่มคำสั่งลงใน AGENTS.md (5 นาที)

```markdown
## Commands
- dev:        `docker compose up`
- unit test:  `docker compose -f compose.test.yaml up unit --abort-on-container-exit --exit-code-from unit`
- e2e:        `docker compose -f compose.test.yaml --profile e2e up e2e --abort-on-container-exit --exit-code-from e2e`
- teardown:   `docker compose -f compose.test.yaml down -v`
```

> ตอนนี้ agent สามารถรัน test ใน environment เดียวกับ CI ได้แล้ว —
> ความเห็นของมันเรื่อง "ผ่านหรือไม่ผ่าน" จึงเริ่มเชื่อถือได้จริง

---

## Artifacts ที่ต้องส่ง

| Artifact | รายละเอียด | ที่ส่ง |
|---|---|---|
| `Dockerfile` | Multi-stage, non-root, pin tag, มี comment | GitHub repo |
| `.dockerignore` | ครอบคลุม | GitHub repo |
| `compose.yaml` | Dev environment รันได้ด้วยคำสั่งเดียว | GitHub repo |
| `compose.test.yaml` | Test environment พร้อม ephemeral DB | GitHub repo |
| `docs/setup-steps.md` | Before/After จำนวนขั้นตอนและเวลา | GitHub repo |
| `AGENTS.md` | อัปเดต section Commands | GitHub repo |

### เกณฑ์ผ่าน
- [ ] `docker compose up` รันได้บนเครื่องของสมาชิกทุกคนโดยไม่ต้อง setup เพิ่ม
- [ ] ทุกคนในกลุ่มอธิบาย Dockerfile ได้ทุก instruction
- [ ] Test database เป็น ephemeral (`tmpfs` หรือไม่มี volume)
- [ ] ทดสอบแล้วว่า test แดง → exit code ไม่ใช่ 0
- [ ] ไม่มี secret จริง hardcode ใน `compose.yaml` หรือ `compose.test.yaml`
- [ ] ไม่มีบรรทัด `version:` ในไฟล์ compose (เลิกใช้แล้ว)
