import { test, expect } from '../fixtures/app.fixture'

test('AC-REGISTER/BORROW/RETURN: student completes the core journey', async ({ page, authPage }) => {
  await authPage.openRegister()
  await authPage.register({ studentId: '65010001', name: 'Ada Lovelace', email: 'ada@uni.ac.th', password: 'Password123!' })
  await expect(page.getByRole('heading', { name: /วันนี้อยากอ่าน/ })).toBeVisible()
  await page.getByRole('button', { name: 'ยืมหนังสือ' }).first().click()
  await expect(page.getByRole('status')).toContainText('สำเร็จ')
  await page.getByRole('link', { name: 'หนังสือของฉัน' }).click()
  await expect(page.getByRole('button', { name: 'คืนหนังสือ' })).toBeVisible()
  await page.getByRole('button', { name: 'คืนหนังสือ' }).click()
  await expect(page.getByRole('status')).toContainText('คืน')
  await expect(page.getByText('ยังไม่มีหนังสือที่กำลังยืม')).toBeVisible()
})

test('AC-AUTHZ: student cannot open librarian pages', async ({ page, authPage }) => {
  await authPage.openRegister()
  await authPage.register({ studentId: '65010002', name: 'Alan Turing', email: 'alan@uni.ac.th', password: 'Password123!' })
  await expect(page.getByRole('heading', { name: /วันนี้อยากอ่าน/ })).toBeVisible()
  await page.goto('/admin/books')
  await expect(page).toHaveURL(/\/catalog$/)
  await expect(page.getByRole('link', { name: 'เพิ่มหนังสือ' })).toHaveCount(0)
})
