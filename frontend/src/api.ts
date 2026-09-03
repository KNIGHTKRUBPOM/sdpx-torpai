export type Role = 'OWNER' | 'INSTRUCTOR' | 'STUDENT'

export type DemoUser = {
  id: string
  email: string
  displayName: string
  role: Role
}

export type Me = {
  id: string
  email: string
  displayName: string
  privacyAcknowledged?: boolean
  memberships: Array<{
    classroomId: string
    classroomName: string
    role: Role
    groupId: string | null
  }>
}

export type Classroom = {
  id: string
  name: string
  slug: string
  timezone: string
  role: Role
}

export type Assignment = {
  id: string
  classroomId: string
  classroomName: string
  name: string
  description: string
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'FINALIZED'
  deadline: string
  individualDeadline: string | null
  groupMaxScore: number
  individualMaxScore: number
  scoreFloor: number
  scoreCeiling: number
  completionThreshold: number
  instructorWeight: number
  minComparisons: number
  criteria: Array<{
    id: string
    name: string
    prompt: string
    weightPct: number
    side: EvaluationSide
  }>
  assignedCount: number
  answeredCount: number
  groupAssignedCount: number
  groupAnsweredCount: number
  individualAssignedCount: number
  individualAnsweredCount: number
}

export type EvaluationSide = 'GROUP' | 'INDIVIDUAL'

export type Notification = {
  id: string
  type: 'ASSIGNMENT_PUBLISHED' | 'DEADLINE_REMINDER' | 'PAIRS_REGENERATED' | 'SCORES_FINALIZED' | 'EXTRA_PAIRS_ASSIGNED'
  assignmentId: string
  message: string
  path: string
  readAt: string | null
  createdAt: string
}

export type EvaluationPair = {
  id: string
  criterionId: string
  criterion: string
  prompt: string
  left: { id: string; name: string; artifactUrl: string | null }
  right: { id: string; name: string; artifactUrl: string | null }
  choice: ChoiceValue | null
  status: 'UNANSWERED' | 'DRAFT' | 'SUBMITTED'
}

export type EvaluationBundle = {
  assignment: Assignment
  classroom: { id: string; name: string }
  groupId: string
  side: EvaluationSide
  readOnly: boolean
  disabledReason: string | null
  pairs: EvaluationPair[]
}

export type Score = {
  state: 'INTERIM' | 'FINAL' | 'INSUFFICIENT_DATA'
  label: string
  groupComponent: number | null
  individualComponent: number | null
  participationRatio: number
  participationMultiplier: number
  total: number | null
  comparisonCount: number
  flags: string[]
}

export type ChoiceValue = 1 | 2 | 3 | 4 | 5 | 6

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export class ApiClientError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  userId?: string,
): Promise<T> {
  const headers = new Headers(options.headers)
  if (userId) headers.set('X-User-Id', userId)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = body.error || {}
    throw new ApiClientError(response.status, error.code || 'REQUEST_FAILED', error.message || 'เกิดข้อผิดพลาด', error.details)
  }
  return body as T
}

export async function downloadCsv(path: string, body: object, userId: string): Promise<void> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'X-User-Id': userId, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new ApiClientError(response.status, payload.error?.code || 'EXPORT_FAILED', payload.error?.message || 'Export ไม่สำเร็จ')
  }
  const disposition = response.headers.get('Content-Disposition') || ''
  const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1] || 'paireval-report.csv'
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const CHOICES: ReadonlyArray<{ value: ChoiceValue; label: string }> = [
  { value: 1, label: 'ซ้ายดีกว่ามาก' },
  { value: 2, label: 'ซ้ายดีกว่า' },
  { value: 3, label: 'ซ้ายดีกว่าเล็กน้อย' },
  { value: 4, label: 'ขวาดีกว่าเล็กน้อย' },
  { value: 5, label: 'ขวาดีกว่า' },
  { value: 6, label: 'ขวาดีกว่ามาก' },
] as const
