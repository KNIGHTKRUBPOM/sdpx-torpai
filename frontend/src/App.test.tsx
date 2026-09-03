import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

const assignment = {
  id: 'demo-assignment', classroomId: 'demo-classroom', classroomName: 'CSX 301',
  name: 'Sprint 1', description: 'Pairwise review', status: 'PUBLISHED',
  deadline: '2099-01-01T00:00:00Z', individualDeadline: '2099-01-01T00:00:00Z', groupMaxScore: 20, individualMaxScore: 5,
  scoreFloor: 0.6, scoreCeiling: 1, completionThreshold: 0.9, instructorWeight: 1, minComparisons: 3,
  criteria: [{ id: 'criterion-ux', name: 'User Experience', prompt: 'ผลงานใดดีกว่า?', weightPct: 100, side: 'GROUP' }],
  assignedCount: 9, answeredCount: 0, groupAssignedCount: 3, groupAnsweredCount: 0, individualAssignedCount: 6, individualAnsweredCount: 0,
}

const pairs = [1, 2, 3].map((index) => ({
  id: `pair-${index}`, criterionId: 'criterion-ux', criterion: 'User Experience', prompt: `ผลงานใดดีกว่า คู่ ${index}`,
  left: { id: `left-${index}`, name: `Left ${index}`, artifactUrl: 'https://example.com/left' },
  right: { id: `right-${index}`, name: `Right ${index}`, artifactUrl: 'https://example.com/right' },
  choice: null, status: 'UNANSWERED',
}))

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))
}

let comparisonResponder: (input: string | URL, init?: RequestInit) => Promise<Response>
let privacyAcknowledged: boolean | undefined
let notifications: Array<{ id: string; type: string; assignmentId: string; message: string; path: string; readAt: string | null; createdAt: string }>

beforeEach(() => {
  privacyAcknowledged = undefined
  notifications = []
  comparisonResponder = () => json({ savedAt: '2026-08-28T10:00:00Z' })
  const values = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  })
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('fetch', vi.fn((input: string | URL, init?: RequestInit) => {
    const path = String(input)
    if (path.endsWith('/api/demo/users')) return json([{ id: 'student-09', email: 's@example.com', displayName: 'นักศึกษา 09', role: 'STUDENT' }])
    if (path.endsWith('/api/me')) return json({ id: 'student-09', email: 's@example.com', displayName: 'นักศึกษา 09', privacyAcknowledged, memberships: [{ classroomId: 'demo-classroom', classroomName: 'CSX 301', role: 'STUDENT', groupId: 'group-3' }] })
    if (path.endsWith('/api/assignments') && (!init?.method || init.method === 'GET')) return json([assignment])
    if (path.endsWith('/api/notifications')) return json(notifications)
    if (path.endsWith('/api/privacy/acknowledgements')) return json({ noticeVersion: 'v1.0', acknowledgedAt: '2026-09-02T00:00:00Z' }, 201)
    if (path.includes('/api/notifications/') && path.endsWith(':read')) return json({ id: 'notice-1', readAt: '2026-09-02T00:00:00Z' })
    if (path.includes('/my-evaluations')) return json({ assignment, classroom: { id: 'demo-classroom', name: 'CSX 301' }, groupId: 'group-3', side: 'GROUP', readOnly: false, disabledReason: null, pairs })
    if (path.includes('/api/comparisons/')) return comparisonResponder(input, init)
    if (path.includes('/submissions')) return json({ revision: 1, submittedCount: 3, unansweredCount: 0 }, 201)
    if (path.includes('/my-score')) return json({ state: 'INTERIM', label: 'ชั่วคราว — อาจเปลี่ยนแปลงได้', groupComponent: 16.93, individualComponent: 0, participationRatio: 1, participationMultiplier: 1, total: 16.93, comparisonCount: 3, flags: [] })
    return json({ error: { code: 'NOT_FOUND', message: path } }, 404)
  }))
})

async function loginStudent() {
  render(<App />)
  await screen.findByTestId('student-select')
  fireEvent.change(screen.getByTestId('student-select'), { target: { value: 'student-09' } })
  fireEvent.click(screen.getByTestId('login-student'))
  await screen.findByTestId('main-cta')
}

describe('PairEval Local M4 app', () => {
  it('logs in and renders the product navigation and assignment CTA', async () => {
    await loginStudent()
    expect(screen.getByText('PairEval')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'เมนูหลัก' })).toBeInTheDocument()
    expect(screen.getByTestId('main-cta')).toHaveTextContent('กลุ่ม 0 / 3')
  })

  it('loads three server pairs with six accessible forced choices each', async () => {
    await loginStudent()
    fireEvent.click(screen.getByTestId('main-cta'))
    expect(await screen.findAllByRole('radio')).toHaveLength(18)
    expect(screen.getAllByRole('radio', { name: /ซ้ายดีกว่ามาก/ })).toHaveLength(3)
    expect(screen.queryByRole('radio', { name: /เท่ากัน/ })).not.toBeInTheDocument()
  })

  it('opens the separate individual evaluation from the student dashboard', async () => {
    await loginStudent()
    fireEvent.click(screen.getByRole('button', { name: 'รายบุคคล 0 / 6' }))
    await screen.findAllByRole('radio')
    expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).includes('side=INDIVIDUAL'))).toBe(true)
  })

  it('persists drafts, submits a revision, and renders the API score', async () => {
    await loginStudent()
    fireEvent.click(screen.getByTestId('main-cta'))
    const choices = await screen.findAllByRole('radio', { name: /ซ้ายดีกว่าเล็กน้อย/ })
    choices.forEach((choice) => fireEvent.click(choice))
    expect(screen.getByTestId('evaluation-progress')).toHaveTextContent('3 / 3')
    await waitFor(() => expect(screen.getByText(/บันทึกแล้ว เมื่อ/)).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('submit-evaluation'))
    expect(await screen.findByRole('heading', { name: 'ส่งการประเมินแล้ว' })).toBeInTheDocument()
    expect(screen.getAllByText('16.93')).toHaveLength(2)
  })

  it('blocks submission until every visible answer is persisted', async () => {
    await loginStudent()
    fireEvent.click(screen.getByTestId('main-cta'))
    const releases: Array<() => void> = []
    comparisonResponder = () => new Promise((resolve) => {
      releases.push(() => resolve(new Response(JSON.stringify({ savedAt: '2026-08-28T10:00:00Z' }), { status: 200, headers: { 'Content-Type': 'application/json' } })))
    })
    const choices = await screen.findAllByRole('radio', { name: /ซ้ายดีกว่าเล็กน้อย/ })
    choices.forEach((choice) => fireEvent.click(choice))
    const submit = screen.getByTestId('submit-evaluation')
    expect(submit).toBeDisabled()
    expect(submit).toHaveTextContent('รอบันทึกคำตอบ')
    await waitFor(() => expect(releases).toHaveLength(3))
    releases.forEach((release) => release())
    await waitFor(() => expect(submit).toBeEnabled())
  })

  it('serializes rapid saves for the same pair so the newest choice wins', async () => {
    await loginStudent()
    fireEvent.click(screen.getByTestId('main-cta'))
    const bodies: string[] = []
    const releases: Array<() => void> = []
    comparisonResponder = (_input, init) => {
      bodies.push(String(init?.body))
      return new Promise((resolve) => {
        releases.push(() => resolve(new Response(JSON.stringify({ savedAt: '2026-08-28T10:00:00Z' }), { status: 200, headers: { 'Content-Type': 'application/json' } })))
      })
    }
    const firstPairChoices = (await screen.findAllByRole('radio')).slice(0, 6)
    fireEvent.click(firstPairChoices[1])
    fireEvent.click(firstPairChoices[5])
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(JSON.parse(bodies[0]).choice).toBe(2)
    releases[0]()
    await waitFor(() => expect(bodies).toHaveLength(2))
    expect(JSON.parse(bodies[1]).choice).toBe(6)
    releases[1]()
    await waitFor(() => expect(screen.getByTestId('submit-evaluation')).toBeEnabled())
  })

  it('requires first-login privacy acknowledgement before continuing', async () => {
    privacyAcknowledged = false
    await loginStudent()
    expect(screen.getByRole('dialog', { name: 'รับทราบก่อนใช้งาน PairEval' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'รับทราบและใช้งานต่อ' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).endsWith('/api/privacy/acknowledgements'))).toBe(true)
  })

  it('shows a score-free notification and marks it read before opening the assignment', async () => {
    notifications = [{ id: 'notice-1', type: 'ASSIGNMENT_PUBLISHED', assignmentId: 'demo-assignment', message: 'มีงานประเมินใหม่ กรุณาเปิด PairEval', path: '/assignments/demo-assignment', readAt: null, createdAt: '2026-09-02T00:00:00Z' }]
    await loginStudent()
    fireEvent.click(screen.getByRole('button', { name: /มีงานประเมินใหม่/ }))
    await screen.findAllByRole('radio')
    expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).includes('/api/notifications/notice-1:read'))).toBe(true)
  })
})
