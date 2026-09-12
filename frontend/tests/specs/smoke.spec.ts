import { test, expect } from '../fixtures/app.fixture'

test('AC-SMOKE: login page and API are available', async ({ page, request }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'เข้าสู่ระบบ' })).toBeVisible()
  const health = await request.get(`${process.env.E2E_API_URL ?? 'http://localhost:8000'}/api/health`)
  expect(health.ok()).toBeTruthy()
})
