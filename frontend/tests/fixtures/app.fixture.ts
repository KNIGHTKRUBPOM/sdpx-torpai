/* oxlint-disable react-hooks/rules-of-hooks -- Playwright names its fixture callback `use` */
import { test as base } from '@playwright/test'
import { AuthPage } from '../pages/AuthPage'

type Fixtures = { authPage: AuthPage }

export const test = base.extend<Fixtures>({
  page: async ({ page, request }, use) => {
    const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:8000'
    const token = process.env.E2E_SEED_TOKEN ?? 'e2e-local-token'
    const response = await request.post(`${apiUrl}/api/test/reset`, { headers: { 'x-e2e-seed-token': token } })
    if (!response.ok()) throw new Error(`Unable to reset E2E database: ${response.status()}`)
    await use(page)
  },
  authPage: async ({ page }, use) => { await use(new AuthPage(page)) },
})

export { expect } from '@playwright/test'
