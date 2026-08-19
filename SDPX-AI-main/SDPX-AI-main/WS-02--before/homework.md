# Homework: เตรียมพร้อมก่อนเรียน Requirements & API Design

## 🎯 ทำแล้วได้อะไร

| สิ่งที่จะทำได้ | ใช้ในงานจริงอย่างไร |
|---|---|
| ติดตั้งและยืนยันว่า test framework รันได้จริง | สภาพแวดล้อมที่รัน test ไม่ได้ = ทีมทั้งทีมทำงานแบบไร้สัญญาณ |
| ตรวจว่าคำสั่งใน `AGENTS.md` รันได้จริง | เอกสารที่บอกคำสั่งผิดจะทำให้ทั้งคนใหม่และ AI เดินผิดทางตั้งแต่ก้าวแรก |
| วาด component diagram ด้วย Mermaid ที่อยู่ใน git ได้ | diagram ที่อยู่ใน version control จะไม่ล้าสมัยเงียบ ๆ แบบรูปภาพที่แปะไว้ใน chat |
| ตั้งคำถามที่ requirement ยังตอบไม่ได้ | คำถามที่ยังไม่มีคำตอบคือช่องที่ทั้งคนและ AI จะเดาแทน และเป็นต้นเหตุของงานที่ต้องรื้อ |

---

## งานที่ต้องทำก่อนเข้าห้อง

### 1. ติดตั้ง Testing Framework
ติดตั้งให้พร้อม เพื่อใช้ใน week ถัดไป:

**Python (pytest):**
```bash
pip install pytest pytest-cov
# ทดสอบ
echo "def test_ok(): assert 1+1==2" > test_sample.py
pytest test_sample.py  # ต้องเห็น 1 passed
rm test_sample.py
```

**JavaScript / TypeScript (Vitest):**
```bash
npm install --save-dev vitest @vitest/coverage-v8
# เพิ่มใน package.json: "test": "vitest run", "test:watch": "vitest"
# ทดสอบ
echo "import {test, expect} from 'vitest'; test('ok', () => expect(1+1).toBe(2))" > sample.test.ts
npm test  # ต้องเห็น 1 passed
rm sample.test.ts
```

### 2. เพิ่มคำสั่ง test ลงใน AGENTS.md
เปิด `AGENTS.md` ที่สร้างไว้ใน WS-01 แล้วยืนยันว่าบรรทัด `test:` ชี้ไปคำสั่งที่รันได้จริง

```bash
# ทดสอบว่า agent จะรันได้จริง — copy คำสั่งจาก AGENTS.md มารันตรง ๆ
npm test     # หรือ  pytest
```

> ถ้าคำสั่งใน `AGENTS.md` รันไม่ได้ แปลว่า loop ของ agent จะพังตั้งแต่ขั้น Verify

### 3. วาด Component Diagram
วาด component diagram คร่าว ๆ ของ project กลุ่มตัวเอง
ใช้ Mermaid (https://mermaid.js.org/) เขียนในไฟล์ `.md` แล้ว push ขึ้น GitHub
— GitHub render Mermaid ให้อัตโนมัติ ทำให้ diagram อยู่ใน version control และ AI อ่านได้

### 4. เตรียมคำถามสำหรับ Spec
เขียน 3 คำถามที่ **ยังตอบไม่ได้** เกี่ยวกับ requirement ของ project
เช่น "นักศึกษาจองล่วงหน้าได้กี่วัน" "ยกเลิกได้ถึงเมื่อไหร่" "หนึ่งคนจองพร้อมกันได้กี่ห้อง"

> คำถามพวกนี้คือช่องว่างที่ AI จะ "เดาแทน" ให้ถ้าเราไม่ตอบเอง — และมันมักเดาผิด

---

## 🔗 ของที่ทำมา จะกลายเป็นอะไรในห้อง

งานทุกชิ้นในหน้านี้ถูกออกแบบให้เป็น **วัตถุดิบของ lab** ไม่ใช่แบบฝึกหัดที่ทำแล้วทิ้ง
คาบเรียนเริ่มจากสมมติฐานว่าของเหล่านี้พร้อมแล้ว

| ผลงานจาก homework | ถูกใช้ต่อที่ | ถ้ายังไม่มี |
|---|---|---|
| testing framework ที่รันได้ + คำสั่ง test ใน `AGENTS.md` | เป็นเงื่อนไขใน Definition of Done ที่เขียนใน lab ขั้นตอนที่ 1 และใช้เต็มรูปแบบใน WS-03 | เขียน DoD ที่บังคับใช้ไม่ได้จริง |
| component diagram ฉบับร่าง | lab ขั้นตอนที่ 2 — ขัดเกลาเป็น diagram ที่เข้า repo | ใช้เวลา 20 นาทีของ lab ไปกับการเริ่มวาดใหม่ |
| รายการคำถามที่ spec ยังตอบไม่ได้ | lab ขั้นตอนที่ 1 — ใช้ปิดช่องว่างของ requirement ก่อนเขียน AC | เขียน backlog บนสมมติฐานที่ยังไม่มีใครยืนยัน |

> ถ้าทำไม่ทันข้อไหน ให้แจ้งใน 5 นาทีแรกของคาบ — จะได้จัดคู่ช่วยกันได้ทัน
> อย่าเงียบไว้แล้วไปติดกลาง lab เพราะจะกระทบทั้งกลุ่ม
