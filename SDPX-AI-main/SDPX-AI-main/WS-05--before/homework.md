# Homework: เตรียมพร้อมก่อนเรียน Docker

## 🎯 ทำแล้วได้อะไร

| สิ่งที่จะทำได้ | ใช้ในงานจริงอย่างไร |
|---|---|
| นับจำนวนขั้นตอนที่คนใหม่ต้องทำกว่าจะรัน project ได้ | เป็นตัวชี้วัดสุขภาพของ codebase ที่ทีมจริงใช้ (time-to-first-commit) |
| เขียน GitHub Actions workflow ตัวแรก | CI เป็นสิ่งที่ทุกทีมมี — อ่านและแก้ workflow เป็นทักษะพื้นฐาน |
| ตั้ง `permissions` ให้น้อยที่สุดตั้งแต่ workflow แรก | สิทธิ์ที่กว้างเกินจำเป็นคือช่องทางโจมตี build pipeline ที่พบบ่อย |
| ยืนยันว่า Docker ทำงานได้จริงบนเครื่องตัวเอง | ป้องกันไม่ให้ปัญหาสภาพแวดล้อมกินเวลาของ lab |

---

## งานที่ต้องทำก่อนเข้าห้อง

### 1. ยืนยัน Docker ทำงานได้
```bash
docker run hello-world
docker pull postgres:17-alpine
docker images                # ต้องเห็น postgres image
docker compose version       # ต้องเป็น v2 (คำสั่งเว้นวรรค)
```

### 2. สร้าง GitHub Actions Workflow เบื้องต้น
สร้างไฟล์ `.github/workflows/ci.yml`:
```yaml
name: CI

on: [push, pull_request]

permissions:
  contents: read          # ให้สิทธิ์น้อยที่สุดเท่าที่จำเป็น

jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - run: echo "Pipeline works!"
```
Push ขึ้น GitHub และยืนยันว่า workflow รันขึ้น green

### 3. เพิ่ม E2E Test สำหรับ Failure Scenario
เพิ่ม E2E test สำหรับ 1 failure scenario จาก backlog
พร้อม comment อ้าง acceptance criteria ที่มันครอบคลุม

### 4. จดขั้นตอนการ Setup ปัจจุบัน
เขียนลง `docs/setup-steps.md` ว่าเพื่อนใหม่ต้องทำอะไรบ้างกว่าจะรัน app ได้
นับเป็นข้อ ๆ เช่น

```markdown
1. ติดตั้ง Node 24
2. ติดตั้ง PostgreSQL 17 แล้วสร้าง database ชื่อ appdb
3. คัดลอก .env.example เป็น .env แล้วเติมค่า
4. npm ci
5. npm run migrate
6. npm run dev
→ รวม 6 ขั้นตอน ใช้เวลาประมาณ 25 นาที
```

> ตัวเลขนี้คือ **latency ของ Environment Loop** ตอนนี้
> เป้าหมายของ lab สัปดาห์นี้คือลดเหลือ **1 คำสั่ง**

---

## 🔗 ของที่ทำมา จะกลายเป็นอะไรในห้อง

งานทุกชิ้นในหน้านี้ถูกออกแบบให้เป็น **วัตถุดิบของ lab** ไม่ใช่แบบฝึกหัดที่ทำแล้วทิ้ง
คาบเรียนเริ่มจากสมมติฐานว่าของเหล่านี้พร้อมแล้ว

| ผลงานจาก homework | ถูกใช้ต่อที่ | ถ้ายังไม่มี |
|---|---|---|
| Docker ที่ยืนยันแล้วว่ารันได้ | lab ขั้นตอนที่ 1 — build image ตัวแรกของ project | เริ่ม lab ไม่ได้เลย |
| GitHub Actions workflow เบื้องต้นที่รันเขียวแล้ว | WS-06 lab ขั้นตอนที่ 1 — ต่อยอดเป็น pipeline เต็ม | สัปดาห์หน้าต้องเริ่มจากศูนย์ และจะทำ 4 ขั้นตอนไม่ทัน |
| E2E test สำหรับกรณีที่ต้องล้มเหลว | lab ขั้นตอนที่ 3 — พิสูจน์ว่า test environment คืน exit code ที่ถูกต้อง | ไม่มีทางรู้ว่า pipeline จะแดงจริงตอนของพัง หรือเขียวหลอก |
| รายการขั้นตอน setup ปัจจุบันที่จดไว้ | lab ขั้นตอนที่ 2 — ตาราง Before/After ของ Environment Loop | วัดผลของสิ่งที่ทำในคาบนี้ไม่ได้ |

> ถ้าทำไม่ทันข้อไหน ให้แจ้งใน 5 นาทีแรกของคาบ — จะได้จัดคู่ช่วยกันได้ทัน
> อย่าเงียบไว้แล้วไปติดกลาง lab เพราะจะกระทบทั้งกลุ่ม
