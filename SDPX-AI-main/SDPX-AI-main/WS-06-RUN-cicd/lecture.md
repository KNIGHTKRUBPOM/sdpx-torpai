# Lecture: CI/CD & the Integration Loop

**เวลารวม:** 30 นาที

*แนะนำการแบ่งเวลาสำหรับผู้สอน (หน่วย: นาที):* เปิดคาบ → 3 · หัวข้อ 1 → 5 · หัวข้อ 2 → 9 · หัวข้อ 3 → 6 · หัวข้อ 4 → 5

## 🎯 จบคาบนี้แล้วจะทำอะไรได้

| สิ่งที่จะทำได้ | ใช้ในงานจริงอย่างไร |
|---|---|
| ออกแบบ pipeline ที่เรียงจากเร็ว/ถูก ไปช้า/แพง | ประหยัดเวลาทีมและค่า compute ซึ่งเป็นต้นทุนจริงขององค์กร |
| ตั้ง `permissions`, `concurrency`, cache และ pin version ของ action | 4 อย่างนี้คือสิ่งที่ security review มองหาเป็นอันดับแรกใน workflow |
| จัดการเหตุการณ์ secret หลุดตามลำดับที่ถูกต้อง | ทำผิดลำดับ (ลบ commit ก่อน revoke) แปลว่า key ถูกใช้ไปแล้ว |
| อธิบายได้ว่าทำไม deploy บ่อยถึงปลอดภัยกว่า deploy ทีเดียวก้อนใหญ่ | เป็นข้อสรุปจากงานวิจัยด้าน software delivery ที่ขัดกับสัญชาตญาณของหลายคน |

## 📖 ศัพท์ที่ต้องรู้ก่อนเริ่ม

คำที่จะโผล่ซ้ำตลอดคาบ — ถ้าติดตรงไหนให้ย้อนกลับมาดูตารางนี้

| ศัพท์ | ความหมายในบริบทของวิชานี้ |
|---|---|
| **CI** (Continuous Integration) | รวม code เข้า branch หลักบ่อย ๆ และให้ระบบตรวจอัตโนมัติทุกครั้ง |
| **CD** | Continuous *Delivery* = พร้อมปล่อยได้ตลอดเวลา · Continuous *Deployment* = ปล่อยอัตโนมัติจริงเมื่อผ่านทุกด่าน |
| **Pipeline** | ลำดับขั้นตอนอัตโนมัติตั้งแต่ push จนถึง deploy |
| **Workflow / Job / Step** | ไฟล์ pipeline 1 ไฟล์ / กลุ่มงานที่รันบนเครื่องเดียวกัน / คำสั่งเดี่ยวภายใน job |
| **Runner** | เครื่อง (VM หรือ container) ที่รับ job ไปรันให้ |
| **Artifact** | ไฟล์ผลลัพธ์ที่ job เก็บไว้ให้ดาวน์โหลด เช่น coverage report, Playwright report |
| **Secret vs Variable** | ค่าลับที่ถูกปิดบังใน log / ค่าไม่ลับที่อ่านได้ตอน debug — เลือกให้ถูกประเภท |
| **Status check** | ผลของ job ที่ GitHub ใช้ตัดสินว่า PR merge ได้หรือไม่ |
| **Branch protection / Ruleset** | กติกาที่บังคับว่าต้องผ่านอะไรบ้างก่อน merge เข้า branch นั้น |
| **Environment** (GitHub) | กลุ่มการตั้งค่าของปลายทาง deploy หนึ่ง ๆ ตั้งให้ต้องมีคน approve ก่อนได้ |
| **Fail fast** | เรียงด่านจากเร็ว/ถูก ไปช้า/แพง เพื่อให้รู้ว่าพังเร็วที่สุดและประหยัดที่สุด |
| **Concurrency** | กติกาว่าจะให้ run ซ้อนกัน หรือยกเลิก run เก่าเมื่อมี push ใหม่เข้ามา |
| **Pin SHA** | ระบุ commit ของ action ที่ใช้ให้ชัด เพื่อกันเจ้าของ action เลื่อน tag ไปชี้ code อื่น |
| **Supply chain** | ห่วงโซ่ของ dependency และ action ที่เรานำมารัน — เป็นช่องทางโจมตีที่พบบ่อยขึ้นเรื่อย ๆ |
| **DORA metrics** | 4 ตัวชี้วัด: deployment frequency, lead time for changes, change failure rate, recovery time |

---

## ✅ ก่อนเริ่มคาบ — ต้องมีอะไรมาแล้วบ้าง

คาบนี้ต่อจาก `WS-06--before` โดยตรง และจะไม่ทวนเนื้อหาในนั้นซ้ำ
ให้ทุกคนเช็ครายการนี้กับตัวเองใน 2 นาทีแรก

- [ ] อธิบายความต่างของ workflow / job / step ได้
- [ ] บอกได้ว่า secret เก็บที่ไหน และทำไมห้าม hardcode
- [ ] workflow จาก WS-05 ยังรันเขียวอยู่
- [ ] test รันในคอนเทนเนอร์ได้ และคืน exit code ที่ถูกต้องเมื่อ test แดง
- [ ] ติดตั้ง k6 แล้ว และมีตัวเลข baseline ของ loop

> ข้อไหนยังไม่ครบ **ให้ยกมือบอกตอนนี้** ไม่ใช่ตอนเข้า lab —
> ของที่ขาดจะถูกจัดคู่ให้เพื่อนช่วยระหว่างที่ lecture เดินหน้าต่อ

---

## 0. เชื่อมจากสัปดาห์ที่แล้ว

5 สัปดาห์ที่ผ่านมาเราสร้าง loop ไว้ 4 วง — แต่ทั้งหมดมีจุดอ่อนเดียวกัน:
**มันทำงานก็ต่อเมื่อมีคนจำได้ว่าต้องรัน**

**คำถามเปิดคาบ (ให้ยกมือ):**
> "ยกมือถ้าสัปดาห์ที่ผ่านมา เคย push code โดยไม่ได้รัน test ก่อน"

มือจะขึ้นเกือบทั้งห้อง — และนั่นไม่ใช่ความผิดของใคร มันคือธรรมชาติของมนุษย์ภายใต้ deadline
วันนี้เราจะทำให้ test **หลบไม่ได้**

```mermaid
flowchart LR
    subgraph B["ก่อนวันนี้"]
        B1["push"] --> B2{"มีคนจำได้<br/>ว่าต้องรัน test?"}
        B2 -- "จำได้" --> B3["✅"]
        B2 -- "ลืม / รีบ" --> B4["⛔ หลุด"]
    end
    subgraph A["หลังวันนี้"]
        A1["push"] --> A2["CI รันเองทุกครั้ง"]
        A2 --> A3{"เขียว?"}
        A3 -- ไม่ --> A4["merge ถูกบล็อก"]
        A3 -- ใช่ --> A5["merge ได้"]
    end
```

---

## 1. Integration Loop: รวมทุก loop ให้เป็นด่านเดียว

```mermaid
flowchart TB
    P["Push / Open PR"] --> L["Lint + Typecheck<br/><i>เร็วที่สุด แดงก่อนถ้าจะแดง</i>"]
    L --> U["Unit Tests<br/><i>WS-03 harness</i>"]
    U --> E["E2E Tests<br/><i>WS-04 harness บน container จาก WS-05</i>"]
    E --> B["Build<br/><i>WS-05</i>"]
    B --> S["Deploy Staging<br/><i>อัตโนมัติเมื่อเข้า develop</i>"]
    S --> PR["Deploy Production<br/><i>ต้องมีคน approve</i>"]
```

| | ก่อนมี CI | หลังมี CI |
|---|---|---|
| **Latency** | รู้ตอนเพื่อน pull มาแล้วพัง | รู้ภายในไม่กี่นาทีหลัง push |
| **Fidelity** | ขึ้นกับว่าใครจำรัน test ได้บ้าง | รันทุกครั้ง เหมือนกันทุกครั้ง |
| **Coverage** | เฉพาะที่คนนึกออก | ทุก loop ที่เคยสร้างไว้ |

> สิ่งที่เปลี่ยนไปจริง ๆ ไม่ใช่ "มี test" — แต่คือ **"test กลายเป็นสิ่งที่หลบไม่ได้"**

### วัดผลด้วย DORA

```mermaid
flowchart LR
    subgraph SPEED["ความเร็ว"]
        S1["Deployment Frequency<br/><i>deploy บ่อยแค่ไหน</i>"]
        S2["Lead Time for Changes<br/><i>commit → production</i>"]
    end
    subgraph STAB["ความมั่นคง"]
        T1["Change Failure Rate<br/><i>deploy แล้วพังกี่ %</i>"]
        T2["Recovery Time<br/><i>พังแล้วกู้เร็วแค่ไหน</i>"]
    end
    SPEED <-. "ไม่ใช่สิ่งที่ต้องแลกกัน" .-> STAB
```

| ตัวชี้วัด | เกี่ยวกับ loop อย่างไร |
|---|---|
| Deployment frequency | loop สั้น → กล้า deploy บ่อย |
| Lead time for changes | คือ latency ของ loop รวม |
| Change failure rate | คือ fidelity ที่หลุดออกไปถึง user |
| Recovery time | loop ของการแก้ไข |

> 💼 **จากหน้างานจริง**
> สิ่งที่งานวิจัยด้าน software delivery พบซ้ำ ๆ และขัดกับสัญชาตญาณของหลายคนคือ
> **ความเร็วกับความมั่นคงไม่ใช่สิ่งที่ต้องแลกกัน** — ทีมที่ deploy บ่อยที่สุดมักเป็นทีมที่พังน้อยที่สุดด้วย
> เหตุผลตรงไปตรงมา: deploy ที่มีของ 3 อย่างแล้วพัง คุณรู้ทันทีว่าปัญหาอยู่ใน 3 อย่างนั้น
> แต่ deploy ที่สะสมของไว้ 300 อย่าง คุณจะหาไม่เจอ และ rollback ก็ทำไม่ได้เพราะมันพันกันไปหมด
> **"ปล่อยของทีละนิดบ่อย ๆ" จึงเป็นกลยุทธ์ลดความเสี่ยง ไม่ใช่การเร่งงาน**

---

## 2. GitHub Actions Workshop

### โครงสร้าง Workflow ที่ครบ

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ develop, main ]
  pull_request:
    branches: [ develop, main ]

# ให้สิทธิ์น้อยที่สุดเท่าที่จำเป็น (ค่า default ของ repo อาจกว้างเกินไป)
permissions:
  contents: read

# push ใหม่มาระหว่างที่ยังรันอยู่ → ยกเลิกอันเก่า ประหยัดเวลาและ quota
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '24'

jobs:
  # ---------- Job 1: ด่านที่เร็วที่สุด ----------
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - uses: actions/setup-node@v7
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'            # cache npm dependencies

      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - name: Unit Tests
        run: npm test -- --coverage

      - uses: actions/upload-artifact@v7
        if: always()
        with:
          name: coverage-${{ github.sha }}
          path: coverage/

  # ---------- Job 2: E2E ----------
  e2e:
    needs: lint-and-test          # รอ job แรกผ่านก่อน
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - name: Run E2E tests
        run: npx playwright test
        env:
          DATABASE_URL: postgres://testuser:testpass@localhost:5432/testdb
          BASE_URL: http://localhost:3000
      - uses: actions/upload-artifact@v7
        if: failure()             # upload report เฉพาะเมื่อ fail
        with:
          name: playwright-report
          path: playwright-report/

  # ---------- Job 3: Deploy ----------
  deploy:
    needs: [lint-and-test, e2e]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production       # บังคับให้ต้องมีคน approve ได้
    steps:
      - uses: actions/checkout@v7
      - name: Deploy to production
        run: npx vercel --prod --token "$VERCEL_TOKEN"
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

### 4 บรรทัดที่คนมักลืม แต่สำคัญมาก

| บรรทัด | ป้องกันอะไร |
|---|---|
| `permissions: contents: read` | workflow เขียนอะไรก็ได้ใน repo เมื่อถูกแก้โดยไม่ตั้งใจหรือโดย dependency |
| `concurrency` + `cancel-in-progress` | job เก่าค้างกินเวลา ทำให้ latency ของ loop บาน |
| `cache: 'npm'` | pipeline ช้าเพราะ install ใหม่ทุกครั้ง |
| `if: github.event_name == 'push'` | deploy ซ้ำจาก event ที่ไม่ได้ตั้งใจ |

> 💼 **จากหน้างานจริง**
> pipeline เป็นสิ่งที่ **โตขึ้นเรื่อย ๆ ตามอายุ project** และไม่มีใครสังเกตจนกว่ามันจะช้าเกินทน
> ทีมที่ดูแลเรื่องนี้ตั้งงบเวลาไว้ล่วงหน้าเลย เช่น *"PR check ต้องจบใน 10 นาที"*
> แล้วเมื่อเกินงบ ก็ต้องแก้ ไม่ใช่ยอมรับ
> วิธีที่ใช้กันคือ: แยกเป็น 2 ชั้น — ชั้นเร็วรันทุก PR (lint, unit, E2E เฉพาะเส้นทางหลัก)
> และชั้นเต็มรันตอน merge เข้า main หรือรันกลางคืน
> **การรอ pipeline คือเวลาที่ทั้งทีมเสียไปพร้อมกัน จึงคุ้มที่จะลงทุนทำให้มันเร็ว**

---

## 3. กับดัก: Secrets และ Supply Chain

### Secrets หลุดเข้า Repo

```mermaid
flowchart LR
    A["git add ."] --> B[".env ติดไปด้วย"]
    B --> C["push ขึ้น GitHub"]
    C --> D["bot สแกน repo สาธารณะ<br/>ภายในไม่กี่วินาที"]
    D --> E["key ถูกใช้"]
    C -. "ลบ commit ไม่ช่วย —<br/>history อยู่ใน cache และใน clone ของคนอื่นแล้ว" .-> F["⛔"]
```

**วิธีป้องกัน:**
```yaml
# ใน GitHub Actions: ใช้ secrets เสมอ
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}

# ไม่ใช่:
env:
  DATABASE_URL: "postgres://user:password@host/db"
```

**ถ้า Secret หลุดแล้ว — เรียงตามลำดับ:**
1. **Revoke ทันที** ที่ service ที่ออก secret นั้น
2. Generate ใหม่ แล้ว update ใน GitHub Secrets
3. ค่อยไปจัดการ git history

> 💼 **จากหน้างานจริง**
> ลำดับข้างบนสำคัญมาก และคนมักทำสลับ — คือรีบไปลบ commit ก่อน แล้วค่อยคิดเรื่อง revoke
> ซึ่งช้าเกินไป เพราะมี bot ที่ไล่สแกน commit สาธารณะตลอดเวลา และเวลาตอบสนองวัดกันเป็นวินาที
> **สมมติเสมอว่า secret ที่ push ขึ้นไปแล้ว = secret ที่หลุดแล้ว** ไม่ว่าจะลบเร็วแค่ไหน
> ในทีมจริง เรื่องนี้ไม่ถือเป็นความผิดของคน ๆ เดียว แต่ถือเป็นความล้มเหลวของระบบ —
> จึงต้องเปิด push protection และ pre-commit hook ไว้ เพื่อให้ระบบจับก่อนที่คนจะพลาด

### Supply Chain: action ที่เราเรียกใช้ก็คือ code ที่เรารัน

```yaml
# พอใช้ได้: pin major version — ได้ security fix อัตโนมัติ
- uses: actions/checkout@v7

# ปลอดภัยที่สุด: pin commit SHA — ไม่มีใครเปลี่ยนของใต้เท้าเราได้
- uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
```

สำหรับ action จาก third-party (ไม่ใช่ `actions/*`) ให้ pin SHA เสมอ
เพราะ tag เป็นแค่ label ที่เจ้าของ repo เลื่อนไปชี้ code อื่นได้ทุกเมื่อ

```mermaid
flowchart LR
    W["workflow ของเรา"] --> A["third-party action"]
    A --> S["มีสิทธิ์เข้าถึง<br/>secrets + source code<br/>ของเราทั้งหมด"]
    A -. "เจ้าของเลื่อน tag<br/>ไปชี้ code ใหม่" .-> M["code ที่เราไม่เคยเห็น<br/>รันในเครื่อง CI ของเรา"]
```

> 💼 **จากหน้างานจริง**
> Build pipeline เป็นเป้าหมายที่มีค่าสูงมากสำหรับผู้โจมตี — เพราะมันมีสิทธิ์เข้าถึงทั้ง source code
> และ credential สำหรับ deploy ขึ้น production มีเหตุการณ์จริงหลายครั้งที่ผู้โจมตีเข้าทาง
> dependency หรือ action ที่ทีมเรียกใช้ แทนที่จะเจาะระบบตรง ๆ
> แนวปฏิบัติที่กลายเป็นมาตรฐานคือ: pin SHA, ให้ `permissions` น้อยที่สุด,
> ไม่ให้ workflow ที่รันจาก PR ของคนนอกแตะ secret ได้ และแยก credential ของ deploy
> ออกจาก credential ทั่วไป

### Log ก็รั่วได้

```yaml
- run: echo "Deploying with $DATABASE_URL"   # ❌ โผล่ใน log
```
GitHub มาสก์ค่า secret ให้บางกรณี แต่ไม่เสมอไป (เช่นถ้าถูกแปลงเป็น base64 ก่อน)
กติกาง่าย ๆ: **อย่า echo อะไรที่มาจาก `secrets.*`**

---

## 4. Branch Protection & Fail Fast

### Branch Protection = ทำให้ loop หลบไม่ได้

Settings > Branches (หรือ Rules > Rulesets) สำหรับ `main`:
- ✅ Require status checks to pass — เลือก `lint-and-test`, `e2e`
- ✅ Require branches to be up to date before merging
- ✅ Require a pull request before merging (1 reviewer)
- ✅ Block force pushes

> ถ้าไม่มีข้อนี้ CI ก็เป็นแค่ "ไฟสัญญาณที่มองข้ามได้"
> **Loop จะมีความหมายก็ต่อเมื่อผลของมันมีผลจริง**

### Fail Fast

```mermaid
flowchart LR
    A["Lint<br/>~20 วิ"] --> B["Unit<br/>~1 นาที"]
    B --> C["E2E<br/>~5 นาที"]
    C --> D["Build<br/>~3 นาที"]
    D --> E["Deploy"]
    A -. "แดงตรงนี้<br/>ประหยัดไป 9 นาที" .-> X["หยุด"]
```

เรียงจากเร็ว/ถูก ไปช้า/แพง — ประหยัดเวลา developer และ compute

### เมื่อ Pipeline แดง

```mermaid
flowchart TB
    F["job แดง"] --> R["อ่าน error แรก<br/>ไม่ใช่ error สุดท้าย"]
    R --> L["reproduce ใน local<br/>ด้วยคำสั่งเดียวกับ CI"]
    L --> FIX["แก้จน green ใน local"]
    FIX --> P["push ครั้งเดียว"]
    F -. "❌ อย่าทำ" .-> BAD["push ซ้ำ ๆ เพื่อ debug<br/>loop 10 วินาที → 5 นาที"]
```

```bash
docker compose -f compose.test.yaml up unit \
  --abort-on-container-exit --exit-code-from unit
```

นี่คือเหตุผลที่เราทำ container ไว้ตั้งแต่ WS-05 — เพื่อให้ reproduce ปัญหาของ CI ได้ในเครื่องตัวเอง

> 💼 **จากหน้างานจริง**
> "แก้ CI ด้วยการ push ซ้ำ ๆ" เป็นนิสัยที่แพงมาก และมองเห็นได้จากภายนอก —
> commit history ที่เต็มไปด้วย `fix ci`, `fix ci again`, `please work`
> คือสัญญาณว่าคนนั้นกำลังทำงานใน loop ที่ latency สูงกว่าที่ควรจะเป็นสิบเท่า
> ทีมที่ทำงานเป็นระบบจะลงทุนให้ **รัน pipeline เดียวกันได้ในเครื่องตัวเอง**
> เพราะมันเปลี่ยน loop จาก 5 นาทีเหลือไม่กี่วินาที

> **ให้ AI ช่วยได้ตรงไหน:** วาง log ของ job ที่แดงให้ agent อ่านพร้อมไฟล์ workflow
> มันเก่งเรื่องตีความ error ของ YAML/CI มาก แต่ **อย่าให้มันแก้ workflow แล้ว push ทันที** —
> ทุก push คือการรัน pipeline จริง ให้ reproduce ใน local ก่อนเสมอ

---

## Key Takeaways

- Integration Loop ทำให้ทุก loop ที่สร้างมา 5 สัปดาห์กลายเป็นสิ่งที่หลบไม่ได้
- ความเร็วกับความมั่นคงไม่ใช่สิ่งที่ต้องแลกกัน — deploy ทีละนิดคือกลยุทธ์ลดความเสี่ยง
- ตั้ง `permissions`, `concurrency`, cache และ pin version — 4 บรรทัดที่คนลืมบ่อยที่สุด
- สมมติเสมอว่า secret ที่ push แล้ว = secret ที่หลุดแล้ว — **revoke ก่อน แล้วค่อยจัดการ history**
- Build pipeline คือเป้าหมายที่มีค่าสูงของผู้โจมตี — pin SHA และให้สิทธิ์น้อยที่สุด
- Branch protection คือสิ่งที่ทำให้ผลของ loop มีความหมาย
- ตั้งงบเวลาให้ pipeline แล้วรักษาไว้ — การรอ pipeline คือเวลาที่ทั้งทีมเสียพร้อมกัน

---

## AI-DLC Connection: Operations Phase — Deploy & Verify Stages

```mermaid
flowchart LR
    B["Build<br/>WS-05"] --> D["Deploy<br/><b>วันนี้</b>"] --> V["Verify<br/><b>วันนี้</b>"] --> M["Monitor<br/>WS-07"]
```

**CI/CD = AI-DLC Operations Automation:**
- Pipeline รัน test harness ทั้งหมด (unit, E2E) และ build ก่อนทุก deploy
- Branch protection = human checkpoint ที่บังคับใช้อัตโนมัติ
- Staging deploy = verify ก่อนถึง production

ใน AI-DLC ทุก bolt ที่ complete ต้องผ่าน Operations phase:
ไม่มี "เดี๋ยวค่อย deploy" — deploy เป็นส่วนหนึ่งของ definition of done

> และตอนนี้ agent ของเราก็มีสัญญาณระดับเดียวกับที่ทีมใช้ตัดสินใจแล้ว
> สัปดาห์หน้าเราจะเพิ่มสัญญาณสุดท้าย: ความจริงจาก production
