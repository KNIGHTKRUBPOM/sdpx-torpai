# Homework: เตรียมพร้อมก่อนเรียน

## 🎯 ทำแล้วได้อะไร

| สิ่งที่จะทำได้ | ใช้ในงานจริงอย่างไร |
|---|---|
| เห็นด้วยตาตัวเองว่า AI วนแก้กี่รอบกว่าจะผ่าน test | ทำให้เข้าใจว่าทำไมทีมที่มี test ถึงได้ประโยชน์จาก AI มากกว่าทีมที่ไม่มี |
| สร้าง repo และ commit แรกได้เอง | เป็นงานที่ทำซ้ำทุกครั้งที่เริ่ม project ใหม่ในที่ทำงาน |
| ติดนิสัยไม่ commit ไฟล์ที่มี secret | ความผิดพลาดข้อนี้ในงานจริงทำให้ต้อง revoke key ทั้งระบบและต้องรายงานเป็น incident |
| เขียนบันทึกสิ่งที่สังเกตได้เป็นข้อความสั้น ๆ | ทักษะพื้นฐานของการเขียน bug report และ postmortem ที่คนอ่านแล้วเข้าใจ |

---

## งานที่ต้องทำให้เสร็จก่อนเข้าห้อง

### 1. ติดตั้งและยืนยัน Tools
รันคำสั่งต่อไปนี้และ screenshot ผลลัพธ์:
```bash
node --version
python --version
docker --version
docker compose version
git --version
```

### 2. สร้าง GitHub Account
- สร้าง account ที่ https://github.com
- ตั้งชื่อ username ที่ professional (จะใช้ในอาชีพการงาน)
- เพิ่ม profile picture

### 3. ทดลอง Git เบื้องต้น
สร้าง repository แรกบน GitHub:
```bash
mkdir my-first-repo
cd my-first-repo
git init
echo "# My First Repo" > README.md
git add README.md
git commit -m "docs: add readme"
# push ขึ้น GitHub
```

### 4. ทดลอง AI Agent Loop ครั้งแรก
ใน repo เดียวกัน ให้ AI agent ที่เลือกไว้ทำงานนี้:

```
Create a Python file `fizzbuzz.py` with a function fizzbuzz(n),
and a pytest file `test_fizzbuzz.py` that tests it.
Then run pytest and fix the code until all tests pass.
```

**สิ่งที่ต้องบันทึก** (เขียนลง `LOOP_NOTES.md` ใน repo เดียวกัน):
- AI รัน test ไปกี่รอบกว่าจะเขียว
- มีรอบไหนที่ test แดงแล้ว AI แก้ถูกทันทีไหม
- ถ้า **ไม่มี** test ให้ AI รันเลย คุณคิดว่าผลจะต่างไปอย่างไร

> นี่คือการทดลอง "loop" ครั้งแรกของวิชา — เราจะกลับมาคุยเรื่องนี้ในห้อง
> ถ้า agent ที่ใช้รัน command ไม่ได้ ให้รัน `pytest` เองแล้ววาง error กลับไปให้ AI
> แล้วบันทึกว่าต้องวนกี่รอบ

### 5. ห้ามลืม
- อย่า commit ไฟล์ `.env` หรือ key ใด ๆ ตั้งแต่ repo แรก
- ถ้าเผลอ commit key ไปแล้ว ให้ **revoke key นั้นทันที** — การลบ commit ไม่ช่วย

---

## 🔗 ของที่ทำมา จะกลายเป็นอะไรในห้อง

งานทุกชิ้นในหน้านี้ถูกออกแบบให้เป็น **วัตถุดิบของ lab** ไม่ใช่แบบฝึกหัดที่ทำแล้วทิ้ง
คาบเรียนเริ่มจากสมมติฐานว่าของเหล่านี้พร้อมแล้ว

| ผลงานจาก homework | ถูกใช้ต่อที่ | ถ้ายังไม่มี |
|---|---|---|
| screenshot version ของ tools ทั้ง 5 ตัว | ยืนยันหน้าคาบว่าเครื่องพร้อมเข้า lab | อาจารย์จะไม่รู้ว่าใครติดปัญหา จนกระทั่งสายเกินแก้ในคาบ |
| repo แรก + commit แรกของตัวเอง | lab ขั้นตอนที่ 2 — สร้าง repo ของกลุ่ม โดยไม่ต้องสอน git ซ้ำ | ทั้งกลุ่มต้องรอคนที่ยังไม่เคยใช้ git |
| `LOOP_NOTES.md` — จำนวนรอบที่ AI วนกว่า test จะเขียว | lecture หัวข้อ 2 — เอาตัวเลขจริงของนักศึกษามาคุยเรื่อง Loop Engineering | ฟังเรื่อง loop แบบนามธรรม แทนที่จะเห็นจากข้อมูลของตัวเอง |
| นิสัยไม่ commit ไฟล์ `.env` | lab ขั้นตอนที่ 4 — ตั้ง `.gitignore` และ `.env.example` | เสี่ยงทำ secret หลุดตั้งแต่ commit แรกของ project จริง |

> ถ้าทำไม่ทันข้อไหน ให้แจ้งใน 5 นาทีแรกของคาบ — จะได้จัดคู่ช่วยกันได้ทัน
> อย่าเงียบไว้แล้วไปติดกลาง lab เพราะจะกระทบทั้งกลุ่ม
