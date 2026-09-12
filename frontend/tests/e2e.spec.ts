import { test, expect } from '@playwright/test';

test('has title and renders UniLib header', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Vite|UniLib/i);
  await expect(page.getByText('UniLib', { exact: true })).toBeVisible();
});
