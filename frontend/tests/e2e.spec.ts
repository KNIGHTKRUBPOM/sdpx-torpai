import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function acknowledgePrivacyIfNeeded(page: import('@playwright/test').Page) {
  await page.getByRole('heading', { name: /งานประเมินของฉัน|จัดเตรียม PairEval/ }).waitFor()
  const button = page.getByRole('button', { name: 'รับทราบและใช้งานต่อ' })
  if (await button.isVisible()) await button.click()
}

test('instructor can enter the persistent M1 workspace', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/PairEval/i)
  await page.getByTestId('login-instructor').click()
  await acknowledgePrivacyIfNeeded(page)
  await expect(page.getByRole('heading', { name: 'จัดเตรียม PairEval' })).toBeVisible()
  await expect(page.getByText('สร้าง Classroom')).toBeVisible()
  await expect(page.getByText('Import Roster CSV')).toBeVisible()
})

test('student saves, reloads, submits, and sees a database-backed score', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('student-select').selectOption('student-09')
  await page.getByTestId('login-student').click()
  await acknowledgePrivacyIfNeeded(page)
  await page.getByTestId('main-cta').click()

  const leftChoices = page.getByRole('radio', { name: /ซ้ายดีกว่าเล็กน้อย/ })
  const rightChoices = page.getByRole('radio', { name: /ขวาดีกว่าเล็กน้อย/ })
  await expect(leftChoices.first()).toBeVisible()
  const choices = await leftChoices.first().isChecked() ? rightChoices : leftChoices
  const count = await choices.count()
  expect(count).toBeGreaterThan(0)
  for (let index = 0; index < count; index += 1) await choices.nth(index).check()
  await expect(page.getByText(/บันทึกแล้ว เมื่อ/)).toBeVisible()

  await page.reload()
  await page.getByTestId('main-cta').click()
  await expect(choices.first()).toBeChecked()
  await page.getByTestId('submit-evaluation').click()
  await expect(page.getByRole('heading', { name: 'ส่งการประเมินแล้ว' })).toBeVisible()
  await expect(page.getByText(/Interim score/i)).toBeVisible()
})

test('M2 student completes a separate individual evaluation backed by generated pairs', async ({ page, request }) => {
  const suffix = `${Date.now()}`
  const instructorHeaders = { 'X-User-Id': 'instructor-demo' }
  const classroomResponse = await request.post('/api/classrooms', {
    headers: instructorHeaders,
    data: { name: `M2 E2E ${suffix}`, slug: `m2-e2e-${suffix}`, timezone: 'Asia/Bangkok' },
  })
  expect(classroomResponse.ok()).toBeTruthy()
  const classroom = await classroomResponse.json()
  const rosterRows: string[] = []
  for (const [groupIndex, group] of ['Alpha', 'Beta', 'Gamma'].entries()) {
    for (let memberIndex = 1; memberIndex <= 5; memberIndex += 1) {
      const number = groupIndex * 5 + memberIndex
      rosterRows.push(`e2e-${suffix}-${number}@uni.example,${group},${number},E2E Student ${number},https://example.com/${group.toLowerCase()}`)
    }
  }
  const rosterResponse = await request.post(`/api/classrooms/${classroom.id}/roster:import`, {
    headers: instructorHeaders,
    multipart: {
      file: {
        name: 'roster.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(`email,group_name,student_id,display_name,artifact_url\n${rosterRows.join('\n')}`),
      },
    },
  })
  expect(rosterResponse.ok()).toBeTruthy()
  const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const assignmentResponse = await request.post(`/api/classrooms/${classroom.id}/assignments`, {
    headers: instructorHeaders,
    data: {
      name: 'M2 Browser Flow', description: 'Individual evaluation E2E', deadline,
      individualDeadline: deadline, groupMaxScore: 15, individualMaxScore: 5,
      criteria: [
        { name: 'UX', prompt: 'ผลงานกลุ่มใดใช้งานชัดเจนกว่า?', weightPct: 100, side: 'GROUP' },
        { name: 'Teamwork', prompt: 'สมาชิกคนใดมีส่วนร่วมมากกว่า?', weightPct: 100, side: 'INDIVIDUAL' },
      ],
    },
  })
  expect(assignmentResponse.ok()).toBeTruthy()
  const assignment = await assignmentResponse.json()
  expect((await request.post(`/api/assignments/${assignment.id}:publish`, { headers: instructorHeaders, data: {} })).ok()).toBeTruthy()
  const users = await (await request.get('/api/demo/users')).json()
  const student = users.find((item: { email: string }) => item.email === `e2e-${suffix}-1@uni.example`)
  expect(student).toBeTruthy()

  await page.goto('/')
  await page.getByTestId('student-select').selectOption(student.id)
  await page.getByTestId('login-student').click()
  await acknowledgePrivacyIfNeeded(page)
  await page.getByRole('button', { name: 'รายบุคคล 0 / 6' }).click()
  const choices = page.getByRole('radio', { name: /ซ้ายดีกว่าเล็กน้อย/ })
  await expect(choices).toHaveCount(6)
  for (let index = 0; index < 6; index += 1) await choices.nth(index).check()
  await expect(page.getByText(/บันทึกแล้ว เมื่อ/)).toBeVisible()

  await page.reload()
  await page.getByRole('button', { name: 'รายบุคคล 6 / 6' }).click()
  await expect(page.getByRole('radio', { name: /ซ้ายดีกว่าเล็กน้อย/ }).first()).toBeChecked()
  await page.getByTestId('submit-evaluation').click()
  await expect(page.getByRole('heading', { name: 'คะแนนยังไม่พร้อม' })).toBeVisible()
  await expect(page.getByText('ผลงานรายบุคคล')).toBeVisible()
})

test('login and student dashboard have no automated WCAG A/AA violations', async ({ page }) => {
  await page.goto('/')
  const loginResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(loginResults.violations).toEqual([])

  await page.getByTestId('student-select').selectOption('student-09')
  await page.getByTestId('login-student').click()
  await acknowledgePrivacyIfNeeded(page)
  await expect(page.getByRole('heading', { name: 'งานประเมินของฉัน' })).toBeVisible()
  const dashboardResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(dashboardResults.violations).toEqual([])
})
