# Lab: E2E Testing & E2E Test Harness

## เวลา: 1.5 ชั่วโมง
## เป้าหมาย
สร้าง E2E Test Harness ครบ 4 ชั้น ที่ครอบคลุม user journey หลัก และพร้อมรันใน CI

## 🎯 ทำ lab นี้แล้วได้ทักษะอะไร

| สิ่งที่จะทำได้ | ใช้ในงานจริงอย่างไร |
|---|---|
| สร้าง Page Object ที่แยก locator ออกจาก assertion | เมื่อ UI เปลี่ยน แก้ที่เดียวแทนที่จะไล่แก้ทุก test |
| ตั้ง fixture ที่ seed และ cleanup ให้ทุก test เริ่มจากจุดเดียวกัน | test ที่ปนเปื้อนกันเองคือสาเหตุอันดับต้น ๆ ของผลลัพธ์ที่เชื่อไม่ได้ |
| รัน test ซ้ำหลายรอบเพื่อจับ flaky ตั้งแต่ก่อนขึ้น CI | ถูกกว่าและเร็วกว่าการไปเจอตอน pipeline แดงกลางดึกมาก |
| เขียน test ที่ trace กลับไปหา acceptance criteria ได้ | ทำให้ตอบได้ว่า feature นี้ถูกทดสอบครบตามที่ตกลงไว้หรือยัง |

---

## 📦 ของที่ต้องมีอยู่แล้วก่อนเริ่ม lab

lab นี้ **ไม่เริ่มจากศูนย์** — มันต่อยอดจากงานใน `WS-04--before` ทันที
ถ้าแถวไหนยังว่าง ให้จัดการแถวนั้นก่อนเป็นอย่างแรก แล้วค่อยไล่ขั้นตอนตามปกติ

| ต้องมี | จะถูกใช้ที่ | ถ้ายังไม่มี |
|---|---|---|
| Docker Desktop ที่รันได้ | lab ขั้นตอนที่ 2 และเป็นพื้นฐานทั้งหมดของ WS-05 | จะไปติดหนักในสัปดาห์ถัดไป |
| accessible role และ `data-testid` ใน component | lab ขั้นตอนที่ 3–4 — เขียน page object และ E2E | ต้องเขียน locator ที่ผูกกับโครงสร้าง HTML แล้ว test จะ flaky ตั้งแต่ตัวแรก |
| seed endpoint สำหรับเตรียมข้อมูลทดสอบ | lab ขั้นตอนที่ 2 — fixtures และ test isolation | test แต่ละตัวจะแย่งข้อมูลกัน และผลจะเปลี่ยนตามลำดับการรัน |

**แผนสำรองเมื่อของไม่ครบ:** จับคู่กับเพื่อนที่ทำมาแล้ว ใช้เครื่องของเขาเดินต่อ
แล้วตามเก็บงานของตัวเองหลังคาบ — สิ่งที่ห้ามทำคือให้ทั้งกลุ่มหยุดรอคนเดียว

---

## ขั้นตอนที่ 1 — โครงสร้างและ Config (15 นาที)

```
tests/
├── e2e/
│   ├── fixtures/
│   │   └── index.ts          ← custom fixtures + seed data
│   ├── pages/
│   │   ├── HomePage.ts       ← Page Objects
│   │   └── [Domain]Page.ts
│   ├── seed/
│   │   └── test-data.ts      ← seed data definitions
│   └── specs/
│       ├── smoke.spec.ts     ← basic health checks
│       └── [domain].spec.ts  ← feature tests
└── playwright.config.ts
```

### สร้าง Playwright Config
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: !process.env.CI,   // local: ขนาน / CI: เรียงเพื่อความนิ่ง
  forbidOnly: !!process.env.CI,     // กัน test.only หลุดเข้า CI
  retries: process.env.CI ? 1 : 0,  // retry น้อย ๆ เพื่อไม่ให้ซ่อน flaky
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  // ให้ Playwright สตาร์ท app เองถ้ายังไม่ได้รัน — ลด "ลืมเปิด server"
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

> `forbidOnly` และ `webServer` เป็นสองบรรทัดที่ช่วยเรื่อง fidelity มากที่สุด
> อันแรกกัน `test.only` ทำให้ CI เขียวทั้งที่รันแค่ test เดียว
> อันที่สองกันเคส "ลืมเปิด server แล้ว test แดงเพราะเหตุผลผิด ๆ"

---

## ขั้นตอนที่ 2 — Seed Data และ Fixtures (20 นาที)

```typescript
// tests/e2e/seed/test-data.ts
export const testData = {
  rooms: [
    { id: 1, name: 'A101', capacity: 10, isAvailable: true  },
    { id: 2, name: 'A102', capacity: 20, isAvailable: false },
  ],
  users: [
    { id: 1, email: 'student@test.com', role: 'student' },
  ],
};
```

```typescript
// tests/e2e/fixtures/index.ts
import { test as base, expect } from '@playwright/test';

type TestFixtures = { cleanDb: void };

export const test = base.extend<TestFixtures>({
  cleanDb: [async ({ request }, use) => {
    // Setup: seed ข้อมูลก่อน test
    const res = await request.post('/api/test/seed');
    expect(res.ok(), 'seed endpoint must succeed').toBeTruthy();

    await use();

    // Teardown: cleanup หลัง test แม้ test จะ fail
    await request.post('/api/test/cleanup');
  }, { auto: true }],
});

export { expect };
```

> ใช้ `request` fixture ของ Playwright แทน `fetch` ตรง ๆ
> เพราะมันใช้ `baseURL` เดียวกับ test — เปลี่ยน environment ทีเดียวได้ทั้งชุด

**ยืนยันว่า seed endpoint ปิดใน production:**
```typescript
// app/api/test/seed/route.ts
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not found', { status: 404 });
  }
  // ...
}
```

---

## ขั้นตอนที่ 3 — สร้าง Page Objects (20 นาที)

```typescript
// tests/e2e/pages/[Domain]Page.ts
import { Page, Locator } from '@playwright/test';

export class DomainPage {
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.submitButton   = page.getByRole('button', { name: /submit|book|save/i });
    this.successMessage = page.getByTestId('success-msg');
    this.errorMessage   = page.getByTestId('error-msg');
  }

  async goto() {
    await this.page.goto('/[route]');
  }

  async fillForm(data: Record<string, string>) {
    for (const [label, value] of Object.entries(data)) {
      await this.page.getByLabel(label).fill(value);
    }
  }

  async submit() {
    await this.submitButton.click();
  }
}
```

**Checklist ของ Page Object:**
- [ ] ไม่มี `expect()` อยู่ข้างใน
- [ ] locator เป็น `readonly` property ไม่ใช่ string กระจายในแต่ละ method
- [ ] method ชื่อตามภาษาของ domain (`selectRoom`) ไม่ใช่ภาษาของ UI (`clickDiv3`)

---

## ขั้นตอนที่ 4 — เขียน E2E Tests (30 นาที)

### Smoke Tests (Health Check)
```typescript
// tests/e2e/specs/smoke.spec.ts
import { test, expect } from '../fixtures';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Campus/);
  await expect(page.getByRole('navigation')).toBeVisible();
});

test('main feature page accessible', async ({ page }) => {
  await page.goto('/[main-route]');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
```

### Feature Tests (Happy Path + Edge Cases)
เลือก acceptance criteria จาก GitHub Issue มา implement ตรง ๆ

```typescript
// tests/e2e/specs/[domain].spec.ts
import { test, expect } from '../fixtures';
import { DomainPage } from '../pages/[Domain]Page';

const tomorrow = () =>
  new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

test.describe('[Domain] feature', () => {
  // AC: Given logged in, When submit valid booking, Then confirmed
  test('happy path: booking succeeds', async ({ page }) => {
    const domainPage = new DomainPage(page);
    await domainPage.goto();

    await domainPage.fillForm({ Date: tomorrow(), Room: 'A101' });
    await domainPage.submit();

    await expect(domainPage.successMessage).toBeVisible();
  });

  // AC: Given room booked, When another books same slot, Then rejected
  test('edge case: double booking is rejected', async ({ page }) => {
    const domainPage = new DomainPage(page);
    await domainPage.goto();

    await domainPage.fillForm({ Date: tomorrow(), Room: 'A102' });
    await domainPage.submit();

    await expect(domainPage.errorMessage).toContainText('not available');
  });
});
```

> เขียน comment อ้าง AC ไว้เหนือทุก test — เวลา present จะ trace กลับหา story ได้ทันที

### รันและตรวจ
```bash
npx playwright test
npx playwright show-report

# รันซ้ำ 3 รอบเพื่อจับ flaky ตั้งแต่วันนี้
npx playwright test --repeat-each=3
```

**ถ้ารอบใดรอบหนึ่งแดง = มี flaky** ให้หา root cause ตอนนี้เลย อย่ารอให้ไปโผล่ใน CI

---

## Artifacts ที่ต้องส่ง

| Artifact | รายละเอียด | ที่ส่ง |
|---|---|---|
| `playwright.config.ts` | มี baseURL, trace, forbidOnly | GitHub repo |
| `tests/e2e/pages/` | Page Objects ≥ 1 ไฟล์ (ไม่มี expect ข้างใน) | GitHub repo |
| `tests/e2e/fixtures/` | Custom fixture พร้อม seed/cleanup | GitHub repo |
| `tests/e2e/specs/` | Smoke test + ≥ 2 feature tests ที่อ้าง AC | GitHub repo |
| `playwright-report/` | HTML report จากการรัน | GitHub repo |

### เกณฑ์ผ่าน
- [ ] E2E tests รันผ่านทั้งหมด
- [ ] `--repeat-each=3` แล้วยังเขียวทุกรอบ (ไม่มี flaky)
- [ ] มี Page Object อย่างน้อย 1 ตัว และไม่มี `expect()` ข้างใน
- [ ] Seed data และ cleanup ทำงานได้ และ seed endpoint ปิดใน production
- [ ] ไม่มี `waitForTimeout` และไม่มีวันที่ hardcode ในทุก test
- [ ] ทุก feature test อ้างถึง acceptance criteria ที่มาจาก GitHub Issue
