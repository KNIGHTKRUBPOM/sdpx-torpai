import { test, expect } from '../fixtures/app.fixture'

test('AC-ADD-BOOK: librarian adds a book and sees it in catalog', async ({ page, authPage }) => {
  await authPage.openLogin()
  await authPage.login(process.env.LIBRARIAN_EMAIL ?? 'librarian@example.com', process.env.LIBRARIAN_PASSWORD ?? 'Library123!')
  await page.getByRole('link', { name: 'เพิ่มหนังสือ' }).click()
  await page.getByLabel('ชื่อหนังสือ').fill('Clean Architecture')
  await page.getByLabel('ผู้แต่ง').fill('Robert C. Martin')
  await page.getByLabel('หมวดหมู่').fill('Software Engineering')
  await page.getByLabel('ISBN').fill('9780134494166')
  await page.getByRole('button', { name: 'เพิ่มหนังสือเข้าคลัง' }).click()
  await expect(page.getByRole('status')).toContainText('สำเร็จ')
  await page.getByRole('link', { name: 'ค้นหาหนังสือ' }).click()
  await expect(page.getByText('Clean Architecture')).toBeVisible()
})
