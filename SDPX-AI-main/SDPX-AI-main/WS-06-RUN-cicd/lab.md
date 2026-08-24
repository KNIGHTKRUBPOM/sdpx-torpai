# Lab: CI/CD & the Integration Loop

## เวลา: 1.5 ชั่วโมง
## เป้าหมาย
สร้าง GitHub Actions pipeline ที่รัน loop ทั้งหมดอัตโนมัติ และทำให้มันหลบไม่ได้

## 🎯 ทำ lab นี้แล้วได้ทักษะอะไร

| สิ่งที่จะทำได้ | ใช้ในงานจริงอย่างไร |
|---|---|
| สร้าง pipeline ที่รัน lint, test, E2E และ deploy อัตโนมัติ | เป็นโครงสร้างเดียวกับที่ใช้ในทีมจริง เพียงแต่ scale ต่างกัน |
| พิสูจน์ว่า branch protection บล็อก merge ได้จริง | ทำให้ผลของ CI มีความหมาย ไม่ใช่แค่ไฟสัญญาณที่มองข้ามได้ |
| debug pipeline โดย reproduce ใน local ก่อน push | ลด loop จาก 5 นาทีเหลือไม่กี่วินาที และไม่ทำให้ history เต็มไปด้วย "fix ci" |
| บันทึกและเปรียบเทียบตัวเลข lead time ก่อน-หลัง | เป็นวิธีรายงานผลงานที่ผู้บริหารเข้าใจ |

---

## 📦 ของที่ต้องมีอยู่แล้วก่อนเริ่ม lab

lab นี้ **ไม่เริ่มจากศูนย์** — มันต่อยอดจากงานใน `WS-06--before` ทันที
ถ้าแถวไหนยังว่าง ให้จัดการแถวนั้นก่อนเป็นอย่างแรก แล้วค่อยไล่ขั้นตอนตามปกติ

| ต้องมี | จะถูกใช้ที่ | ถ้ายังไม่มี |
|---|---|---|
| workflow จาก WS-05 ที่ยังรันเขียวอยู่ | lab ขั้นตอนที่ 1 — ต่อยอดเป็น pipeline เต็ม | ต้องเขียน workflow ใหม่ตั้งแต่ต้นและทำ lab ไม่ทัน |
| test ที่รันในคอนเทนเนอร์และคืน exit code ถูกต้อง | lab ขั้นตอนที่ 1 — เป็นสิ่งที่ทำให้ pipeline fail ได้จริง | ได้ pipeline ที่เขียวตลอดแม้ test จะพัง ซึ่งอันตรายกว่าไม่มี pipeline |
| k6 ที่ติดตั้งแล้ว | WS-07 — เริ่มยิง load test ได้ทันที | สัปดาห์หน้าจะเสียเวลาช่วงต้นคาบไปกับการติดตั้ง |
| ตัวเลข baseline ของ loop | lab ขั้นตอนที่ 4 — เทียบก่อน/หลังมี pipeline | ไม่มีหลักฐานว่า Integration Loop ทำให้อะไรดีขึ้น |

**แผนสำรองเมื่อของไม่ครบ:** จับคู่กับเพื่อนที่ทำมาแล้ว ใช้เครื่องของเขาเดินต่อ
แล้วตามเก็บงานของตัวเองหลังคาบ — สิ่งที่ห้ามทำคือให้ทั้งกลุ่มหยุดรอคนเดียว

---

## ขั้นตอนที่ 1 — สร้าง Full Pipeline (40 นาที)

สร้างหรือแก้ไข `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ develop, main ]
  pull_request:
    branches: [ develop, main ]

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '24'

jobs:
  lint-and-unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - name: Setup Node.js
        uses: actions/setup-node@v7
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npm run typecheck

      - name: Unit Tests with Coverage
        run: npm test -- --coverage

      - name: Upload Coverage Report
        uses: actions/upload-artifact@v7
        if: always()
        with:
          name: coverage-${{ github.sha }}
          path: coverage/

  e2e-tests:
    needs: lint-and-unit-test
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgres://testuser:testpass@localhost:5432/testdb
      BASE_URL: http://localhost:3000

    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci

      - name: Cache Playwright browsers
        uses: actions/cache@v6
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}

      - run: npx playwright install --with-deps chromium

      - name: Run E2E Tests
        run: npx playwright test
        # playwright.config.ts มี webServer อยู่แล้ว จึงไม่ต้องสตาร์ท app เอง

      - name: Upload Playwright Report
        uses: actions/upload-artifact@v7
        if: always()
        with:
          name: playwright-report-${{ github.sha }}
          path: playwright-report/
          retention-days: 7

  deploy-staging:
    needs: [lint-and-unit-test, e2e-tests]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    environment: staging

    steps:
      - uses: actions/checkout@v7
      - name: Deploy to Staging
        run: npx vercel --token "$VERCEL_TOKEN" --yes
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### ถ้า Pipeline แดง — ลำดับการแก้
1. คลิก job ที่ fail → คลิก step ที่แดง
2. อ่าน error จากบนลงล่าง หา **error แรก** ไม่ใช่ error สุดท้าย
3. **reproduce ใน local ด้วยคำสั่งเดียวกัน** — นี่คือเหตุผลที่เราทำ container ไว้ใน WS-05
   ```bash
   docker compose -f compose.test.yaml up unit \
     --abort-on-container-exit --exit-code-from unit
   ```
4. แก้จน green ใน local แล้วค่อย push

> ห้าม debug ด้วยการ push ซ้ำ ๆ — นับจำนวน push ที่ใช้แก้ปัญหาหนึ่งไว้ด้วย
> ตอน present อาจถูกถาม

---

## ขั้นตอนที่ 2 — Setup GitHub Secrets และ Environments (15 นาที)

### 2.1 Secrets
1. Settings > Secrets and variables > Actions
2. เพิ่ม secrets ที่จำเป็น: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
3. ค่าที่ไม่ลับ (เช่น `STAGING_URL`) ให้ใส่ใน **Variables** ไม่ใช่ Secrets
   — จะได้อ่านใน log ได้เวลา debug

### 2.2 Environments
1. Settings > Environments > New environment → `staging` และ `production`
2. สำหรับ `production` เปิด **Required reviewers** เพิ่มสมาชิกในกลุ่ม
   → deploy จะหยุดรอให้คนกด approve = human checkpoint ที่บังคับใช้จริง

### 2.3 ตรวจว่าไม่มี Secrets ใน Code
```bash
# ค้นหา pattern ที่น่าสงสัยใน history
git log -p | grep -inE "(api[_-]?key|password|secret|token)\s*[:=]" | head -20

# ตรวจว่าเคยมี .env เข้ามาไหม
git log --all --full-history -- "**/.env*"
```
เปิด Settings > Code security แล้วยืนยันว่า **Secret scanning** เปิดอยู่

---

## ขั้นตอนที่ 3 — Branch Protection (15 นาที)

1. Settings > Rules > Rulesets > New branch ruleset (หรือ Branches > Add rule)
2. Target branch: `main`
3. เปิด:
   - ✅ Require a pull request before merging (1 review)
   - ✅ Require status checks to pass: `lint-and-unit-test`, `e2e-tests`
   - ✅ Require branches to be up to date before merging
   - ✅ Block force pushes

### ทดสอบว่า Protection ทำงานจริง (บังคับ)
```bash
git switch -c test/break-pipeline
# แก้ test 1 ตัวให้ fail
git commit -am "test: intentionally break a test"
git push -u origin test/break-pipeline
# เปิด PR → ต้องเห็น pipeline fail และปุ่ม Merge ถูกบล็อก
```
Screenshot หน้าจอที่ merge ถูกบล็อกเก็บไว้ที่ `docs/screenshots/`
แล้วปิด PR ทิ้ง ไม่ต้อง merge

---

## ขั้นตอนที่ 4 — วัดผล Loop (10 นาที)

### 4.1 เพิ่ม Test Summary ใน PR
```yaml
      - name: Test Summary
        uses: dorny/test-reporter@v3
        if: always()
        with:
          name: Test Results
          path: 'test-results/*.xml'
          reporter: jest-junit
```
(ต้องตั้ง reporter ให้ออก JUnit XML ก่อน เช่น `vitest --reporter=junit --outputFile=test-results/unit.xml`)

### 4.2 บันทึกตัวเลข
สร้าง `docs/loop-metrics.md`:
```markdown
# Loop Metrics — WS-06

| ตัวชี้วัด | ก่อนมี CI | หลังมี CI |
|---|---|---|
| Unit test ใช้เวลา | X วินาที (local) | X วินาที (CI) |
| E2E ใช้เวลา | X นาที | X นาที |
| Pipeline ทั้งอัน | — | X นาที |
| Lead time (commit → staging) | X นาที | X นาที |
| Deployment frequency | X ครั้ง/สัปดาห์ | (คาดว่า) X ครั้ง/สัปดาห์ |

## Pipeline ช้าที่สุดตรงไหน
[job/step ไหน + ใช้เวลาเท่าไร + จะลดได้อย่างไร]

## จำนวน push ที่ใช้ไปในการ debug pipeline วันนี้
[ตัวเลข] — และครั้งหน้าจะลดได้อย่างไร
```

---

## Artifacts ที่ต้องส่ง

| Artifact | รายละเอียด | ที่ส่ง |
|---|---|---|
| `.github/workflows/ci.yml` | Pipeline ที่รันผ่าน มี permissions + concurrency + cache | GitHub repo |
| Pipeline run URL | Link ไปยัง successful run | ส่งใน LMS |
| `docs/screenshots/` | หน้าจอที่ merge ถูกบล็อกเพราะ CI แดง | GitHub repo |
| `docs/loop-metrics.md` | ตัวเลข before/after | GitHub repo |

### เกณฑ์ผ่าน
- [ ] Pipeline รันผ่านทุก job
- [ ] มี `permissions:` และ `concurrency:` ใน workflow
- [ ] ไม่มี secrets hardcode ใน workflow file และไม่มีการ echo ค่า secret
- [ ] Branch protection เปิดแล้วสำหรับ `main` และ **พิสูจน์แล้วว่าบล็อก merge ได้จริง**
- [ ] Environment `production` ต้องมีคน approve ก่อน deploy
- [ ] บันทึกตัวเลข loop metrics แล้ว
