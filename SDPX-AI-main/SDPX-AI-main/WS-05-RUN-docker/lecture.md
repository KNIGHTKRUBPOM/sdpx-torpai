# Lecture: Docker & the Environment Loop

**เวลารวม:** 30 นาที

*แนะนำการแบ่งเวลาสำหรับผู้สอน (หน่วย: นาที):* เปิดคาบ → 3 · หัวข้อ 1 → 4 · หัวข้อ 2 → 4 · หัวข้อ 3 → 4 · หัวข้อ 4 → 9 · หัวข้อ 5 → 3

## 🎯 จบคาบนี้แล้วจะทำอะไรได้

| สิ่งที่จะทำได้ | ใช้ในงานจริงอย่างไร |
|---|---|
| เขียน Dockerfile แบบ multi-stage ที่ปลอดภัยและ reproducible | image ที่มี dev tool ติดไปด้วยคือเครื่องมือที่ผู้บุกรุกได้ใช้ฟรีเมื่อเจาะเข้ามาได้ |
| อธิบายได้ทุกบรรทัดว่าทำไมต้องมี | ตอน review PR ที่แก้ Dockerfile คุณจะรู้ว่าอะไรผิดปกติ |
| ตั้ง compose ให้ dev, test และ CI ใช้คำจำกัดความเดียวกัน | ตัดปัญหา "works on my machine" ซึ่งเป็นต้นทุนแฝงที่ใหญ่มากในทีม |
| ตรวจว่า automation ที่ตั้งไว้ "แดงได้จริง" | pipeline ที่เขียวหลอกเป็นความล้มเหลวที่แพงที่สุด เพราะไม่มีใครรู้ตัว |

## 📖 ศัพท์ที่ต้องรู้ก่อนเริ่ม

คำที่จะโผล่ซ้ำตลอดคาบ — ถ้าติดตรงไหนให้ย้อนกลับมาดูตารางนี้

| ศัพท์ | ความหมายในบริบทของวิชานี้ |
|---|---|
| **Image** | แม่แบบที่อ่านอย่างเดียว ใช้สร้าง container — เทียบได้กับ class |
| **Container** | instance ที่กำลังรันของ image — เทียบได้กับ object |
| **Dockerfile** | ไฟล์สูตรที่บอกว่าจะ build image อย่างไร ทีละคำสั่ง |
| **Layer / Layer cache** | ชั้นของ image ที่เกิดจากคำสั่งแต่ละบรรทัด / การนำ layer เดิมมาใช้ซ้ำเมื่อไม่มีอะไรเปลี่ยน |
| **Multi-stage build** | การแบ่ง Dockerfile เป็นหลาย stage แล้วเอาเฉพาะผลลัพธ์ที่จำเป็นขึ้น image สุดท้าย |
| **Tag pinning** | ระบุเวอร์ชันของ base image ให้ชัด (เช่น `node:24-alpine`) แทนการใช้ `latest` ที่เปลี่ยนได้ตลอด |
| **.dockerignore** | รายการไฟล์ที่ห้าม copy เข้า image เช่น `node_modules`, `.git`, `.env` |
| **Compose** | เครื่องมือรันหลาย container พร้อมกันตามไฟล์ `compose.yaml` — ใช้คำสั่ง `docker compose` (เว้นวรรค) |
| **Service** | 1 container ที่นิยามไว้ในไฟล์ compose |
| **Profile** | กลุ่มของ service ที่จะรันเฉพาะเมื่อเรียกชื่อ profile นั้น เช่น `--profile test` |
| **Volume / tmpfs / Ephemeral** | ที่เก็บข้อมูลถาวร / ที่เก็บใน RAM / สภาพที่ข้อมูลหายไปเมื่อ container หยุด |
| **Healthcheck** | คำสั่งที่ Docker ใช้ถามว่า container พร้อมทำงานหรือยัง |
| **Liveness vs Readiness** | "ยังไม่ตายใช่ไหม" กับ "พร้อมรับ traffic หรือยัง" — คนละคำถาม และมักถูกใช้สลับกัน |
| **Exit code** | ตัวเลขที่ process คืนเมื่อจบ — `0` = สำเร็จ, ไม่ใช่ 0 = ล้มเหลว **CI ใช้ตัวเลขนี้ตัดสินทุกอย่าง** |

---

## ✅ ก่อนเริ่มคาบ — ต้องมีอะไรมาแล้วบ้าง

คาบนี้ต่อจาก `WS-05--before` โดยตรง และจะไม่ทวนเนื้อหาในนั้นซ้ำ
ให้ทุกคนเช็ครายการนี้กับตัวเองใน 2 นาทีแรก

- [ ] อธิบายความต่างของ image กับ container ได้
- [ ] Docker รันได้ และเคย build image เองมาแล้วอย่างน้อย 1 ครั้ง
- [ ] มี GitHub Actions workflow เบื้องต้นที่รันเขียวแล้ว
- [ ] มี E2E test อย่างน้อย 1 ตัวที่ตั้งใจให้ล้มเหลว เพื่อทดสอบ exit code
- [ ] จดขั้นตอน setup ปัจจุบันของกลุ่มมาแล้วว่ามีกี่ขั้น

> ข้อไหนยังไม่ครบ **ให้ยกมือบอกตอนนี้** ไม่ใช่ตอนเข้า lab —
> ของที่ขาดจะถูกจัดคู่ให้เพื่อนช่วยระหว่างที่ lecture เดินหน้าต่อ

---

## 0. เชื่อมจากสัปดาห์ที่แล้ว

เรามี test แล้วทั้ง unit และ E2E — แต่ test มีค่าก็ต่อเมื่อ **ทุกคนรันได้ผลเหมือนกัน**

**คำถามเปิดคาบ (ให้กลุ่มนับกัน 1 นาที):**
> "ตอนนี้ถ้าเพื่อนใหม่มา clone repo ของกลุ่ม ต้องทำกี่ขั้นตอนกว่าจะรัน app ได้"

ให้แต่ละกลุ่มขานตัวเลข ส่วนใหญ่จะอยู่ที่ 5–8 ขั้นตอน / 20–40 นาที
**วันนี้จะทำให้เหลือ 1 คำสั่ง**

```mermaid
flowchart TB
    subgraph BEFORE["ก่อน"]
        B1["ติดตั้ง Node version ที่ถูก"] --> B2["ติดตั้ง PostgreSQL"]
        B2 --> B3["สร้าง database"] --> B4["ตั้งค่า .env"]
        B4 --> B5["npm ci"] --> B6["migrate"] --> B7["npm run dev"]
    end
    subgraph AFTER["หลัง"]
        A1["docker compose up"]
    end
```

---

## 1. Environment Loop

```mermaid
flowchart LR
    C["clone repo"] --> U["docker compose up"]
    U --> R["app + db รันครบ"]
    R --> T["รัน test ได้ทันที"]
    T -. "ผลเหมือนกันทุกเครื่อง" .-> R
```

| คุณสมบัติ | ก่อนมี container | หลังมี container |
|---|---|---|
| **Latency** | 20–40 นาที ต่อคน ต่อเครื่อง | 1 คำสั่ง ไม่กี่นาที |
| **Fidelity** | "works on my machine" | ทุกเครื่องได้ image เดียวกัน |
| **Coverage** | dev ต่างจาก CI ต่างจาก prod | dev/CI ใช้ definition เดียวกัน |

**ทำไมเรื่องนี้อยู่ในวิชาที่พูดเรื่อง AI:** AI agent ก็ต้องรัน test เหมือนกัน
ถ้า environment ตั้งยาก agent จะรัน test ไม่ได้ → มันจะ**เดาแทน**
environment ที่ reproducible คือสิ่งที่ทำให้ agent ตรวจงานตัวเองได้จริง

> 💼 **จากหน้างานจริง**
> ตัวชี้วัดที่หลายทีมใช้วัดสุขภาพของ codebase คือ **time-to-first-commit** ของคนใหม่ —
> ตั้งแต่วันแรกที่เข้าทีม กี่วันถึงจะ merge PR แรกได้
> ทีมที่ environment ตั้งยากมักใช้เวลาเป็นสัปดาห์ ส่วนทีมที่ทำ container ไว้ดีวัดกันเป็นชั่วโมง
> ต้นทุนตรงนี้ไม่ได้จ่ายครั้งเดียว — จ่ายทุกครั้งที่มีคนเข้าใหม่ ทุกครั้งที่มีคนเปลี่ยนเครื่อง
> และทุกครั้งที่มีคนกลับมาจากลาพักร้อนแล้ว dependency เปลี่ยนไปแล้ว

---

## 2. Docker Fundamentals

### Image vs Container

```mermaid
flowchart LR
    DF["Dockerfile<br/><i>สูตร</i>"] -- "docker build" --> IMG["Image<br/><i>read-only</i>"]
    IMG -- "docker run" --> C1["Container 1"]
    IMG -- "docker run" --> C2["Container 2"]
    IMG -- "docker run" --> C3["Container 3"]
```

```
Image     = blueprint (read-only)
Container = running instance ของ image (มี read-write layer เพิ่มมา)

เหมือน: Image = class, Container = object instance
```

### Layer System

```dockerfile
FROM node:24-alpine       # Layer 1: base OS + Node
WORKDIR /app              # Layer 2: set working directory
COPY package*.json ./     # Layer 3: copy manifest
RUN npm ci                # Layer 4: install dependencies
COPY . .                  # Layer 5: copy source code
RUN npm run build         # Layer 6: build
CMD ["node", "server.js"] # Layer 7: default command
```

```mermaid
flowchart TB
    L1["Layer 1-2: base + workdir"] --> L3["Layer 3: COPY package.json"]
    L3 --> L4["Layer 4: npm ci"]
    L4 --> L5["Layer 5: COPY source"]
    L5 --> L6["Layer 6: build"]
    L1 -. "cache ✅" .-> OK1[" "]
    L3 -. "cache ✅" .-> OK2[" "]
    L4 -. "cache ✅" .-> OK3[" "]
    L5 -. "แก้ code = ต้องทำใหม่ 🔁" .-> NO1[" "]
    L6 -. "ต้องทำใหม่ 🔁" .-> NO2[" "]
```

แก้ Layer 5 (source code) → Layer 5, 6, 7 rebuild ใหม่
Layer 1–4 ยังใช้ cache ได้ → `npm ci` ไม่ต้องรันใหม่

---

## 3. กับดัก: Layer Caching ที่พลาด

```dockerfile
# แย่: COPY ทั้งหมดก่อน
COPY . .              # ← ถ้าแก้ไฟล์ใด ๆ layer นี้ invalid
RUN npm install       # ← ต้อง install ใหม่ทุกครั้ง แม้ package.json ไม่เปลี่ยน

# ดี: แยก dependencies ออกก่อน
COPY package*.json ./  # ← เปลี่ยนน้อยมาก
RUN npm ci             # ← cache ได้เมื่อ package.json ไม่เปลี่ยน
COPY . .               # ← source code เปลี่ยนบ่อยก็ไม่กระทบ install
```

**หลักจำง่าย:** เรียงจากสิ่งที่ **เปลี่ยนน้อยที่สุด** ไปหาสิ่งที่ **เปลี่ยนบ่อยที่สุด**

### Multi-Stage Build ที่ใช้ได้จริง

```mermaid
flowchart LR
    D["deps<br/><i>npm ci</i>"] --> B["build<br/><i>npm run build</i>"]
    B --> T["test<br/><i>npm test</i>"]
    B --> R["runtime<br/><i>เอาแค่ผลลัพธ์</i>"]
    R -. "ไม่มี devDependencies<br/>ไม่มี source code<br/>image เล็กกว่ามาก" .-> P["Production"]
```

```dockerfile
# ---------- deps ----------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci                       # ci = ติดตั้งตรงตาม lockfile เป๊ะ ๆ

# ---------- build ----------
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- test ----------
FROM build AS test
CMD ["npm", "test"]              # stage นี้ใช้ตอนรัน test ใน container

# ---------- runtime ----------
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev            # ไม่เอา devDependencies ขึ้น production
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
EXPOSE 3000
USER node                        # ไม่รันด้วย root
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
```

จุดที่ต้องอธิบายได้ทุกคน:

| instruction | ทำไม |
|---|---|
| `node:24-alpine` (pin tag) | alpine = image เล็ก, pin = build วันนี้กับพรุ่งนี้ได้ของเดียวกัน |
| `npm ci` | ยึด lockfile เป๊ะ ต่างจาก `npm install` ที่อาจอัป version ให้ |
| `--omit=dev` | flag ปัจจุบัน (`--only=production` เลิกใช้แล้ว) |
| `USER node` | ถ้า container ถูกเจาะ ผู้บุกรุกไม่ได้เป็น root |
| `HEALTHCHECK` | บอกว่า "พร้อมรับ traffic แล้ว" ไม่ใช่แค่ "process ยังอยู่" |

> 💼 **จากหน้างานจริง**
> เหตุผลที่ทีมงานให้ความสำคัญกับขนาด image ไม่ใช่เรื่องพื้นที่เก็บ แต่เป็นเรื่อง **ความเร็วในการ deploy
> และพื้นที่โจมตี** — image ที่มี compiler, git, dev tools ติดไปด้วย คือเครื่องมือที่ผู้บุกรุกได้ใช้ฟรี ๆ
> เมื่อเจาะเข้ามาได้ multi-stage build จึงไม่ใช่แค่เรื่อง optimization แต่เป็นเรื่อง security
> อีกเรื่องที่ต่างจากที่หลายคนเข้าใจ: `HEALTHCHECK` และ health endpoint มีความหมายต่างกัน —
> **liveness** (ยังไม่ตายใช่ไหม) กับ **readiness** (พร้อมรับ traffic หรือยัง)
> ระบบใหญ่ ๆ แยกสองอันนี้ เพราะ app ที่กำลัง warm up ยังไม่ควรได้รับ traffic แต่ก็ไม่ควรถูก restart

---

## 4. Compose = คำจำกัดความของ Environment

Compose ทำให้ environment กลายเป็นไฟล์ที่อยู่ใน git — แก้ได้ review ได้ ย้อนได้

> **หมายเหตุ:** ไฟล์ยุคปัจจุบันชื่อ `compose.yaml` และ **ไม่ต้องมี `version:`** แล้ว
> (Compose Specification เลิกใช้ field นั้น — ใส่ไปจะขึ้น warning)

```mermaid
flowchart TB
    subgraph NET["network เดียวกัน"]
        APP["app<br/>:3000"]
        DB[("db<br/>postgres:17")]
        APP -- "postgres://user:pass@db:5432" --> DB
    end
    HOST["เครื่องเรา"] -- "localhost:3000" --> APP
    DB -. "healthcheck ผ่านก่อน<br/>app ถึงเริ่ม" .-> APP
```

```yaml
# compose.yaml
services:
  app:
    build:
      context: .
      target: runtime
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/appdb
    depends_on:
      db:
        condition: service_healthy   # รอ db พร้อมจริง ไม่ใช่แค่ start แล้ว

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

volumes:
  postgres_data:
```

> 💼 **จากหน้างานจริง**
> `depends_on` เฉย ๆ **ไม่ได้รอให้ database พร้อม** — มันรอแค่ให้ container เริ่มทำงาน
> นี่เป็นสาเหตุคลาสสิกของอาการ "รันครั้งแรกพัง รันครั้งที่สองผ่าน" ที่กินเวลา debug ของคนนับไม่ถ้วน
> `condition: service_healthy` คู่กับ `healthcheck` คือคำตอบ
> ในระบบ production จริงยังต้องมีอีกชั้นคือ **retry ฝั่ง application** เอง
> เพราะ database restart ได้ตลอดอายุการใช้งาน ไม่ใช่แค่ตอนเริ่ม

### Profiles: แยก dev ออกจาก test ในไฟล์เดียว

```yaml
  test-db:
    image: postgres:17-alpine
    profiles: ["test"]        # รันเฉพาะเมื่อเรียก profile test
    environment:
      POSTGRES_DB: testdb
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
    ports:
      - "5433:5432"           # port ต่างจาก dev db
    tmpfs:
      - /var/lib/postgresql/data   # เก็บใน RAM → เร็วและหายเองเมื่อหยุด
```

```bash
docker compose up                        # dev
docker compose --profile test up test-db # test database (ephemeral)
docker compose --profile test down -v    # cleanup ทุกอย่าง
```

**ทำไม test database ต้อง ephemeral:**

```mermaid
flowchart LR
    subgraph BAD["มี volume ถาวร"]
        R1["run 1<br/>สร้าง booking"] --> R2["run 2<br/>เจอ booking เก่า"]
        R2 --> R3["test แดงแบบงง ๆ"]
    end
    subgraph GOOD["ephemeral"]
        G1["run 1"] --> G2["ล้างหมด"]
        G2 --> G3["run 2 เริ่มจากศูนย์"]
    end
```

### รัน Test Suite ใน Container

```yaml
# compose.test.yaml
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
      - /var/lib/postgresql/data

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
```

```bash
docker compose -f compose.test.yaml up --abort-on-container-exit --exit-code-from unit
echo "Exit code: $?"    # 0 = pass — ตัวเลขนี้คือสิ่งที่ CI จะใช้ตัดสินใน WS-06
```

`--exit-code-from unit` **สำคัญมาก** — ถ้าไม่มี exit code จะมาจาก container ตัวไหนก็ได้
แล้ว CI จะเขียวทั้งที่ test แดง (fidelity พังแบบเงียบ ๆ)

> 💼 **จากหน้างานจริง**
> "pipeline เขียวแต่ของพัง" เป็นหนึ่งในความล้มเหลวที่แพงที่สุด เพราะมันทำลายความเชื่อ
> ในระบบอัตโนมัติทั้งระบบ และมักใช้เวลานานกว่าจะมีใครสังเกตเห็น
> สาเหตุมักเป็นเรื่องเล็ก ๆ แบบนี้เอง — exit code ไม่ได้ถูกส่งต่อ, `|| true` ที่ใครใส่ไว้กันไม่ให้ job แดง,
> หรือ step ที่ fail แต่ไม่ได้ทำให้ job fail
> **นิสัยที่ควรติดตัว: ทุกครั้งที่ตั้ง automation ใหม่ ให้ทดสอบว่ามัน "แดงได้จริง" ก่อนเสมอ**
> ไม่ใช่ทดสอบแค่ว่ามันเขียวได้

### Config ต้องมาจาก Environment

```yaml
# แย่: ค่าจริงฝังในไฟล์ที่อยู่ใน git
environment:
  DATABASE_URL: postgres://admin:S3cretP%40ss@prod-db.example.com:5432/app

# ดี: อ่านจาก .env / secret ของ platform
environment:
  DATABASE_URL: ${DATABASE_URL:?DATABASE_URL is required}
```

รูปแบบ `${VAR:?message}` ทำให้ Compose **หยุดพร้อมข้อความชัดเจน** ถ้าลืมตั้งค่า
ดีกว่ารันไปแล้วพังลึก ๆ ด้วย error ที่อ่านไม่รู้เรื่อง

> 💼 **จากหน้างานจริง**
> หลักการนี้มาจาก Twelve-Factor App ข้อ III: **config ต้องอยู่ใน environment ไม่ใช่ใน code**
> เกณฑ์ทดสอบที่ตรงที่สุดคือ — *"ถ้า repo นี้กลายเป็น public พรุ่งนี้ จะมีอะไรเสียหายไหม"*
> ถ้าคำตอบคือมี แปลว่ามี config ที่อยู่ผิดที่
> อีกข้อที่คู่กันคือข้อ X (dev/prod parity): ยิ่ง dev ต่างจาก prod มากเท่าไร
> bug ที่ "เจอเฉพาะบน production" ก็ยิ่งเยอะเท่านั้น — container ช่วยเรื่องนี้โดยตรง

---

## 5. Review Dockerfile ที่ AI สร้าง

| AI มักทำ | ทำไมเป็นปัญหา |
|---|---|
| `FROM node:latest` | ไม่ reproducible — build วันนี้กับพรุ่งนี้ได้คนละ image |
| `RUN npm install` | ไม่ยึด lockfile |
| `COPY . .` ก่อน install | ทำลาย layer cache ทั้งหมด |
| ไม่มี `USER` | container รันด้วย root |
| ไม่มี `.dockerignore` | copy `node_modules` และ `.git` เข้า image |
| ใส่ `version:` ใน compose | field ที่เลิกใช้แล้ว |
| ใช้ `--only=production` | flag เก่า ปัจจุบันคือ `--omit=dev` |

**Prompt ที่ให้ผลดีกว่า:**
```
Generate a multi-stage Dockerfile for a Next.js app on node:24-alpine with
stages: deps, build, test, runtime.
Requirements: copy package manifests before source, use `npm ci`,
`npm ci --omit=dev` in runtime, run as non-root, add a HEALTHCHECK,
and pin the base image tag. Explain each instruction in one line as a comment.
```
บรรทัดสุดท้ายสำคัญ — บังคับให้ AI เขียนคำอธิบายไว้ ทำให้ review ง่ายขึ้นมาก

> 💼 **จากหน้างานจริง**
> AI มักสร้าง Dockerfile ที่ "รันได้" แต่ตกยุคไปหลายปี เพราะมันเรียนจากตัวอย่างจำนวนมาก
> ที่กระจายอยู่บนอินเทอร์เน็ต ซึ่งส่วนใหญ่เขียนไว้นานแล้ว
> อาการเดียวกันนี้เกิดกับทุกเรื่องที่ "วิธีปฏิบัติที่ดี" เปลี่ยนไปตามเวลา — flag ที่ deprecated,
> API ที่เลิกใช้, pattern ที่เคยแนะนำแล้วตอนนี้ไม่แนะนำแล้ว
> **นิสัยที่ควรมี: เจอ flag หรือ pattern ที่ AI ให้มาแล้วไม่คุ้น ให้เปิด official docs เช็คก่อนเสมอ**

---

## Key Takeaways

- Environment Loop: จาก "6 ขั้นตอน 25 นาที" เหลือ `docker compose up` คำสั่งเดียว
- Layer order สำคัญมาก — เรียงจากสิ่งที่เปลี่ยนน้อยไปหาสิ่งที่เปลี่ยนบ่อย
- Multi-stage build เป็นเรื่อง security ไม่ใช่แค่ optimization
- `depends_on` เฉย ๆ ไม่ได้รอ database — ต้องใช้ `condition: service_healthy`
- Test database ต้อง ephemeral และต้องใช้ `--exit-code-from` เพื่อให้ผลเชื่อถือได้
- ทุกครั้งที่ตั้ง automation ใหม่ ต้องทดสอบว่ามัน **แดงได้จริง** ก่อน
- Config มาจาก environment เสมอ — ทดสอบด้วยคำถาม "ถ้า repo นี้เป็น public พรุ่งนี้จะเสียหายไหม"

---

## AI-DLC Connection: Operations Phase — Build Stage

```mermaid
flowchart LR
    B["Build<br/><b>วันนี้</b>"] --> D["Deploy<br/>WS-06"] --> V["Verify<br/>WS-06"] --> M["Monitor<br/>WS-07"]
```

**Docker = Build Stage Infrastructure:**
- Dockerfile = reproducible build process ที่ทุก bolt ใช้ร่วมกัน
- Compose = คำจำกัดความของ environment ที่ dev, test และ CI ใช้ตรงกัน
- Test container (ephemeral) = environment ที่แยกออกมาสำหรับ verify ก่อน deploy

Human checkpoint ใน Build Stage: ทุก Dockerfile ต้องอ่านออกและอธิบายได้ทุกบรรทัด
AI generate Dockerfile → human verify ว่า secure, efficient และ reproducible

> สัปดาห์หน้า CI จะเป็นตัวรันคำสั่งพวกนี้ให้อัตโนมัติทุกครั้งที่ push —
> สิ่งที่ตั้งวันนี้จะกลายเป็นเนื้อหาของ pipeline พอดี
