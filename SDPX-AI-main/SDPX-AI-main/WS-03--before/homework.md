# Homework: เตรียมพร้อมก่อนเรียน Unit Testing

## 🎯 ทำแล้วได้อะไร

| สิ่งที่จะทำได้ | ใช้ในงานจริงอย่างไร |
|---|---|
| ยืนยันว่า test framework รันได้ก่อนเข้าห้อง | เวลาของทีมมีค่า — คนที่มาแล้วเครื่องรันไม่ได้ทำให้ทั้งกลุ่มช้าลง |
| วัดว่า test suite ของกลุ่มใช้เวลากี่วินาที | เวลารัน test คือตัวชี้วัดที่ทีมมืออาชีพเฝ้าดูเหมือน performance ของ product |
| ติดตั้ง Playwright ให้พร้อมล่วงหน้า | การเตรียมเครื่องมือก่อนถึงเวลาใช้ เป็นนิสัยที่ทำให้ sprint ไม่สะดุด |
| ปรับ backlog ตาม feedback ที่ได้รับ | requirement เปลี่ยนเป็นเรื่องปกติ — ทักษะคือปรับให้ทันโดยไม่ทำของเดิมพัง |

---

## งานที่ต้องทำก่อนเข้าห้อง

### 1. ยืนยัน Testing Framework ทำงานได้
```bash
# Python
pytest --version   # ต้องขึ้น version

# JavaScript / TypeScript
npm test           # ต้องเห็น test passed (จาก sample test ที่ทำใน WS-02--before)
```

### 2. Revise Backlog และ Wireframe
- แก้ user stories ตาม feedback ที่ได้รับจาก present
- วาด wireframe 3 screens หลักด้วย Excalidraw (https://excalidraw.com)
- เพิ่มใน `docs/wireframes/`

### 3. ติดตั้ง Playwright (สำหรับ E2E ที่จะเริ่มใน week นี้)
```bash
npm init playwright@latest
# เลือก TypeScript, tests/ folder, GitHub Actions: No (จะตั้งเองทีหลัง)
npx playwright install --with-deps chromium
# ยืนยัน
npx playwright --version
```

### 4. เตรียมข้อมูลสำหรับ Lab: จับเวลา Test Loop
รัน test suite ปัจจุบัน (แม้จะมีแค่ 1 test) แล้วจดเวลา:
```bash
# Python
pytest --durations=5

# JS/TS
npm test
```

จดไว้ 2 ตัวเลข:
- test suite รันเสร็จในกี่วินาที
- ถ้าแก้ code 1 บรรทัดแล้วอยากรู้ว่าพังไหม ต้องรออีกกี่วินาที

> ตัวเลขนี้คือ **latency ของ Unit Test Loop** ของกลุ่ม เราจะพยายามรักษาให้ต่ำกว่า 10 วินาที
> ตลอดทั้งวิชา เพราะ loop ที่ช้าคือ loop ที่ไม่มีใครรัน (รวมถึง AI agent)

---

## 🔗 ของที่ทำมา จะกลายเป็นอะไรในห้อง

งานทุกชิ้นในหน้านี้ถูกออกแบบให้เป็น **วัตถุดิบของ lab** ไม่ใช่แบบฝึกหัดที่ทำแล้วทิ้ง
คาบเรียนเริ่มจากสมมติฐานว่าของเหล่านี้พร้อมแล้ว

| ผลงานจาก homework | ถูกใช้ต่อที่ | ถ้ายังไม่มี |
|---|---|---|
| testing framework ที่ยืนยันแล้วว่ารันได้ | lab Part A — เริ่มเขียน test ได้ทันทีในนาทีแรก | หมดครึ่ง lab ไปกับการ debug config ของ test runner |
| backlog และ wireframe ที่ revise แล้ว | lab Part A — เลือก business rule ที่จะ test จากที่นี่ | ไม่รู้ว่าอะไรคือกฎที่ควรมี test คุ้มครองมากที่สุด |
| Playwright ที่ติดตั้งแล้ว | lab Part B — เขียน E2E ตัวแรก | เสียเวลา 30 นาทีสุดท้ายไปกับการ download browser |
| ตัวเลขเวลาที่ test loop ของกลุ่มใช้ | lecture หัวข้อ 1 — เทียบ latency ของ loop ระหว่างกลุ่ม | ไม่มีฐานเทียบว่า loop ของกลุ่มตัวเองเร็วหรือช้า |

> ถ้าทำไม่ทันข้อไหน ให้แจ้งใน 5 นาทีแรกของคาบ — จะได้จัดคู่ช่วยกันได้ทัน
> อย่าเงียบไว้แล้วไปติดกลาง lab เพราะจะกระทบทั้งกลุ่ม
