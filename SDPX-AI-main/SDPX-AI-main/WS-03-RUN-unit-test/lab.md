# Lab: Unit Test Harness & First E2E

## เวลา: 1.5 ชั่วโมง
## เป้าหมาย
สร้าง **Unit Test Harness** ของ project ให้ใช้งานได้จริง แล้วเริ่ม E2E test ตัวแรก

## 🎯 ทำ lab นี้แล้วได้ทักษะอะไร

| สิ่งที่จะทำได้ | ใช้ในงานจริงอย่างไร |
|---|---|
| สร้าง test harness (fake, fixture, factory) ที่ใช้ซ้ำได้ | ทำให้ test ชุดต่อ ๆ ไปเขียนได้เร็วขึ้น ซึ่งเป็นสิ่งที่ตัดสินว่าทีมจะเขียน test ต่อไปหรือเลิกเขียน |
| พิสูจน์ fidelity ของ test ด้วยการทำลาย code แล้วดูว่ามันแดง | เป็นวิธีตรวจ safety net ที่ใช้ได้จริงก่อนจะเริ่ม refactor ของสำคัญ |
| ควบคุมเวลารัน test ให้อยู่ในงบที่กำหนด | test ที่ช้าจะถูกข้ามไปในที่สุด ไม่ว่าจะเขียนไว้ดีแค่ไหน |
| เขียน E2E smoke test ตัวแรก | smoke test คือด่านแรกที่ทีมใช้ยืนยันว่า deploy ไม่ได้ทำระบบล่ม |

---

## 📦 ของที่ต้องมีอยู่แล้วก่อนเริ่ม lab

lab นี้ **ไม่เริ่มจากศูนย์** — มันต่อยอดจากงานใน `WS-03--before` ทันที
ถ้าแถวไหนยังว่าง ให้จัดการแถวนั้นก่อนเป็นอย่างแรก แล้วค่อยไล่ขั้นตอนตามปกติ

| ต้องมี | จะถูกใช้ที่ | ถ้ายังไม่มี |
|---|---|---|
| testing framework ที่ยืนยันแล้วว่ารันได้ | lab Part A — เริ่มเขียน test ได้ทันทีในนาทีแรก | หมดครึ่ง lab ไปกับการ debug config ของ test runner |
| backlog และ wireframe ที่ revise แล้ว | lab Part A — เลือก business rule ที่จะ test จากที่นี่ | ไม่รู้ว่าอะไรคือกฎที่ควรมี test คุ้มครองมากที่สุด |
| Playwright ที่ติดตั้งแล้ว | lab Part B — เขียน E2E ตัวแรก | เสียเวลา 30 นาทีสุดท้ายไปกับการ download browser |
| ตัวเลขเวลาที่ test loop ของกลุ่มใช้ | lecture หัวข้อ 1 — เทียบ latency ของ loop ระหว่างกลุ่ม | ไม่มีฐานเทียบว่า loop ของกลุ่มตัวเองเร็วหรือช้า |

**แผนสำรองเมื่อของไม่ครบ:** จับคู่กับเพื่อนที่ทำมาแล้ว ใช้เครื่องของเขาเดินต่อ
แล้วตามเก็บงานของตัวเองหลังคาบ — สิ่งที่ห้ามทำคือให้ทั้งกลุ่มหยุดรอคนเดียว

---

## Part A: Unit Test Harness (60 นาที)

### ขั้นตอนที่ 1 — สร้าง Test Structure (10 นาที)

```
project/
├── src/
│   ├── services/
│   │   └── booking_service.py (หรือ .ts)
│   └── repositories/
│       └── room_repository.py
├── tests/
│   ├── conftest.py           ← fixtures (Python)
│   ├── factories.py          ← factory functions
│   ├── fakes/
│   │   └── fake_room_repo.py ← fake implementations
│   └── unit/
│       └── test_booking_service.py
└── TEST_PLAN.md
```

### ขั้นตอนที่ 2 — เขียน TEST_PLAN.md (10 นาที)

ให้ลอกมาจาก section *Key Business Rules* ใน `memory-bank/units/*/unit-brief.md` โดยตรง
— ทุกกฎที่เขียนไว้ตอน WS-02 ต้องมีบรรทัดของตัวเองที่นี่

```markdown
# Test Plan

## Functions ที่ต้อง Test
1. BookingService.create_booking()
   - ห้องว่าง → booking confirmed
   - ห้องไม่ว่าง → RoomNotAvailableError
   - เวลาซ้อนทับ → ConflictError
   - user ไม่ exists → UserNotFoundError
   - จองย้อนหลัง → InvalidTimeRangeError

2. BookingService.cancel_booking()
   - booking exists และเป็นของ user → cancelled
   - booking ของคนอื่น → ForbiddenError
   - booking ไม่ exists → NotFoundError

## กฎที่ยังไม่มี test (ยอมรับไว้ชั่วคราว)
- [กฎ] — เหตุผลที่ยังไม่ทำ + จะทำเมื่อไหร่
```

### ขั้นตอนที่ 3 — สร้าง Fake Repository (10 นาที)

```python
# tests/fakes/fake_room_repo.py
class FakeRoomRepo:
    def __init__(self, rooms=None):
        self._rooms = {r.id: r for r in (rooms or [])}

    def find_by_id(self, room_id):
        return self._rooms.get(room_id)

    def find_available(self, start_time, end_time):
        return [r for r in self._rooms.values() if r.is_available]

    def save(self, room):
        self._rooms[room.id] = room
        return room
```

> Fake ต้อง implement interface เดียวกับของจริง ไม่งั้น test เขียวแต่ production พัง
> ถ้าใช้ TypeScript ให้ `implements RoomRepository` เพื่อให้ compiler ช่วยตรวจให้

### ขั้นตอนที่ 4 — สร้าง Factories และ Fixtures (10 นาที)

```python
# tests/factories.py
def make_room(**overrides):
    defaults = {"id": 1, "name": "A101", "capacity": 10, "is_available": True}
    return Room(**{**defaults, **overrides})

def make_user(**overrides):
    defaults = {"id": 1, "name": "John", "email": "john@uni.ac.th", "role": "student"}
    return User(**{**defaults, **overrides})
```

```python
# tests/conftest.py
import pytest
from tests.factories import make_room, make_user
from tests.fakes.fake_room_repo import FakeRoomRepo

@pytest.fixture
def available_room():
    return make_room(is_available=True)

@pytest.fixture
def unavailable_room():
    return make_room(is_available=False)

@pytest.fixture
def student():
    return make_user(role="student")
```

**TypeScript เทียบเท่า:**
```typescript
// tests/factories.ts
export const makeRoom = (o: Partial<Room> = {}): Room => ({
  id: 1, name: 'A101', capacity: 10, isAvailable: true, ...o,
});
```

### ขั้นตอนที่ 5 — เขียน Unit Tests (20 นาที)

เขียนด้วยตัวเองก่อนอย่างน้อย 2 ตัว จากนั้นค่อยใช้ AI generate เพิ่ม:

```python
# tests/unit/test_booking_service.py
def test_booking_confirmed_when_room_available(available_room, student):
    repo = FakeRoomRepo([available_room])
    service = BookingService(room_repo=repo)

    result = service.create_booking(
        room_id=available_room.id,
        user_id=student.id,
        start="13:00", end="15:00"
    )

    assert result.status == "confirmed"
    assert result.room_id == available_room.id

def test_booking_rejected_when_room_unavailable(unavailable_room, student):
    repo = FakeRoomRepo([unavailable_room])
    service = BookingService(room_repo=repo)

    with pytest.raises(RoomNotAvailableError):
        service.create_booking(
            room_id=unavailable_room.id,
            user_id=student.id,
            start="13:00", end="15:00"
        )
```

**Prompt สำหรับให้ AI เขียนเพิ่ม:**
```
Read TEST_PLAN.md, tests/factories.py and tests/conftest.py first.

Write the remaining unit tests listed in TEST_PLAN.md for BookingService.

Rules:
- Reuse the existing factories and fixtures — do not create new ones.
- Each test must fail if I delete the specific business rule it covers.
  Put the rule in the test name.
- Do not assert on private methods or internal call order.
- No test that only checks the constructor.
Then run the tests and fix the code (not the tests) until green.
```

**หลัง AI generate — review ทุกตัวด้วย 2 คำถาม:**
1. test นี้วัด business rule ข้อไหนใน `TEST_PLAN.md`
2. ถ้า comment out logic ข้อนั้นออก test จะแดงไหม

ตัวไหนตอบไม่ได้ → **ลบทิ้งทันที** test ที่ไม่ปกป้องอะไรมีต้นทุน (ต้อง maintain) แต่ไม่มีประโยชน์

### ขั้นตอนที่ 6 — วัด Fidelity ของ Harness (บังคับ, ~5 นาที)

เลือก business rule 1 ข้อ แล้วทำ zombie test detection สด ๆ:
```bash
# 1. comment out เงื่อนไข 1 บรรทัดใน service
# 2. รัน test
pytest -q
# 3. ต้องมีอย่างน้อย 1 test แดง — ถ้าเขียวหมด แปลว่า harness ยังไม่ปกป้องกฎข้อนั้น
# 4. undo การแก้
git checkout -- src/
```

บันทึกผลลง `TEST_PLAN.md`:
```markdown
## Fidelity Check (WS-03)
- ลบกฎ: [ชื่อกฎ]
- Test ที่แดง: [ชื่อ test]  ✅ harness ปกป้องกฎนี้
```

**ถ้าเหลือเวลา:** ลองรัน mutation testing แล้วจดคะแนน
```bash
mutmut run          # Python
npx stryker run     # JS/TS
```

---

## Part B: E2E ตัวแรก (30 นาที)

### ขั้นตอนที่ 7 — First E2E Test ด้วย Playwright

```typescript
// tests/e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Campus/);
  await expect(page.getByRole('navigation')).toBeVisible();
});

test('main service page is accessible', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('main-cta')).toBeVisible();
});
```

ตั้ง `baseURL` ใน `playwright.config.ts` เพื่อให้ `page.goto('/')` ใช้ได้:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
});
```

### เพิ่ม data-testid ใน Components
```tsx
<button data-testid="submit-booking">Book Now</button>
<nav data-testid="main-nav">...</nav>
<div data-testid="room-list">...</div>
```

> ลำดับที่แนะนำในการเลือก element: `getByRole` → `getByLabel` → `getByTestId`
> role/label สะท้อนสิ่งที่ user เห็นจริงและได้ accessibility ไปด้วย
> ใช้ `getByTestId` เมื่อไม่มี role/label ที่เสถียรพอ

### รัน E2E Test
```bash
npx playwright test
npx playwright show-report   # เปิด HTML report
```

---

## Artifacts ที่ต้องส่ง

| Artifact | รายละเอียด | ที่ส่ง |
|---|---|---|
| `tests/` directory | Unit tests พร้อม fakes, fixtures, factories | GitHub repo |
| `TEST_PLAN.md` | รายการ business rule ที่ต้อง test + ผล fidelity check | GitHub repo |
| `tests/e2e/smoke.spec.ts` | E2E smoke test ผ่าน | GitHub repo |
| Coverage report | `pytest --cov` หรือ `vitest run --coverage` | GitHub repo `docs/coverage/` |

### เกณฑ์ผ่าน
- [ ] Unit tests รันผ่านทั้งหมด และ **ทั้ง suite ใช้เวลา < 10 วินาที**
- [ ] มี fake repository อย่างน้อย 1 ตัว
- [ ] มี factories หรือ fixtures อย่างน้อย 2 ตัว
- [ ] ทำ fidelity check แล้ว และบันทึกผลใน `TEST_PLAN.md`
- [ ] E2E smoke test รันผ่าน
- [ ] ทุกคนในกลุ่มอธิบาย test ที่ตัวเองเขียนได้ และตอบได้ว่า "ลบอะไรออกแล้วมันจะแดง"
