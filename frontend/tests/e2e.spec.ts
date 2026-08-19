import { expect, test } from '@playwright/test'

test('PairEval homepage loads with primary navigation and CTA', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/PairEval/i)
  await expect(page.getByRole('navigation', { name: 'เมนูหลัก' })).toBeVisible()
  await expect(page.getByTestId('main-cta')).toBeVisible()
})

test('student completes the first pairwise evaluation flow', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('main-cta').click()
  const choices = page.getByRole('radio', { name: /ซ้ายดีกว่าเล็กน้อย/ })
  await expect(choices).toHaveCount(3)
  for (let index = 0; index < 3; index += 1) await choices.nth(index).check()
  await expect(page.getByTestId('evaluation-progress')).toContainText('3 / 3')
  await page.getByTestId('submit-evaluation').click()
  await expect(page.getByRole('heading', { name: 'ส่งการประเมินแล้ว' })).toBeVisible()
  await expect(page.getByText('16.93')).toBeVisible()
})
