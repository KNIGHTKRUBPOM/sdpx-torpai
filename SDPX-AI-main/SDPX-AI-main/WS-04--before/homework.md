# Homework: เตรียมพร้อมก่อนเรียน E2E Testing

## 🎯 ทำแล้วได้อะไร

| สิ่งที่จะทำได้ | ใช้ในงานจริงอย่างไร |
|---|---|
| ทำให้ UI มี role และ label ที่ test อ้างถึงได้ | ได้ accessibility ติดมาด้วยฟรี ๆ ซึ่งหลายองค์กรถือเป็นข้อบังคับตามกฎหมาย |
| เตรียม seed endpoint สำหรับตั้งต้น state ของ test | ระบบทดสอบที่ไม่มี state ตั้งต้นที่แน่นอน จะให้ผลที่เชื่อไม่ได้ |
| ใส่ guard กัน endpoint ทดสอบหลุดขึ้น production | endpoint ที่ล้าง database ได้โดยไม่ต้อง login คือช่องโหว่ระดับร้ายแรง |
| ยืนยันว่า Docker ใช้งานได้ก่อนสัปดาห์หน้า | การเตรียมล่วงหน้าทำให้ไม่เสียเวลาของทั้งทีมในวันที่ต้องใช้จริง |

---

## งานที่ต้องทำก่อนเข้าห้อง

### 1. ติดตั้ง Docker Desktop และทดสอบ
```bash
docker run hello-world
# ต้องเห็น "Hello from Docker!"

docker run --name test-db -e POSTGRES_PASSWORD=test -d postgres:17-alpine
docker ps
# ต้องเห็น container กำลังรัน

docker rm -f test-db
```

### 2. เพิ่ม Accessible Role และ data-testid ใน Components
ไปที่ frontend components ของ project แล้วทำ 2 อย่าง:

**2.1 ใช้ semantic HTML ให้ `getByRole` ทำงานได้**
```tsx
<nav>...</nav>                        {/* role="navigation" */}
<button type="submit">Book Now</button>
<label htmlFor="date">Date</label>
<input id="date" name="date" />       {/* getByLabel('Date') ใช้ได้ */}
```

**2.2 เพิ่ม `data-testid` เฉพาะจุดที่ไม่มี role/label ที่เสถียร**
- Error/success message container
- List item ที่ต้องอ้างถึงเป็นรายตัว (`data-testid="room-card-1"`)
- Element ที่ไม่มีข้อความคงที่

> อย่าใส่ `data-testid` ทุกที่ — ถ้า element มี role ที่ชัดอยู่แล้ว การใช้ `getByRole`
> จะทำให้ test จับ bug ด้าน accessibility ให้ฟรี ๆ ด้วย

### 3. เตรียม Seed Endpoint (ถ้ายังไม่มี)
E2E ต้องเริ่มจาก state ที่รู้แน่ ให้เตรียม endpoint สำหรับ test:
```
POST /api/test/seed      → ใส่ข้อมูลตัวอย่างชุดคงที่
POST /api/test/cleanup   → ล้างข้อมูลที่ seed ไว้
```

**ต้องปิดใน production:**
```typescript
if (process.env.NODE_ENV === 'production') {
  return new Response('Not found', { status: 404 });
}
```

> ถ้าลืมข้อนี้ = ใครก็ล้าง database ของคุณได้ผ่าน internet
> จุดนี้จะถูกถามใน present และใน WS-08 (security)

---

## 🔗 ของที่ทำมา จะกลายเป็นอะไรในห้อง

งานทุกชิ้นในหน้านี้ถูกออกแบบให้เป็น **วัตถุดิบของ lab** ไม่ใช่แบบฝึกหัดที่ทำแล้วทิ้ง
คาบเรียนเริ่มจากสมมติฐานว่าของเหล่านี้พร้อมแล้ว

| ผลงานจาก homework | ถูกใช้ต่อที่ | ถ้ายังไม่มี |
|---|---|---|
| Docker Desktop ที่รันได้ | lab ขั้นตอนที่ 2 และเป็นพื้นฐานทั้งหมดของ WS-05 | จะไปติดหนักในสัปดาห์ถัดไป |
| accessible role และ `data-testid` ใน component | lab ขั้นตอนที่ 3–4 — เขียน page object และ E2E | ต้องเขียน locator ที่ผูกกับโครงสร้าง HTML แล้ว test จะ flaky ตั้งแต่ตัวแรก |
| seed endpoint สำหรับเตรียมข้อมูลทดสอบ | lab ขั้นตอนที่ 2 — fixtures และ test isolation | test แต่ละตัวจะแย่งข้อมูลกัน และผลจะเปลี่ยนตามลำดับการรัน |

> ถ้าทำไม่ทันข้อไหน ให้แจ้งใน 5 นาทีแรกของคาบ — จะได้จัดคู่ช่วยกันได้ทัน
> อย่าเงียบไว้แล้วไปติดกลาง lab เพราะจะกระทบทั้งกลุ่ม
