import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend } from 'k6/metrics'

const apiBase = __ENV.API_BASE_URL || 'http://127.0.0.1:8000'
const evaluationLatency = new Trend('evaluation_latency', true)
const autosaveLatency = new Trend('autosave_latency', true)
const submissionLatency = new Trend('submission_latency', true)
const pairingLatency = new Trend('pairing_generation_latency', true)
const recomputeLatency = new Trend('score_recompute_latency', true)

export const options = {
  scenarios: {
    deadline_spike: {
      executor: 'per-vu-iterations',
      vus: 200,
      iterations: 1,
      maxDuration: __ENV.PERF_MAX_DURATION || '2m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    evaluation_latency: ['p(95)<2000', 'p(99)<4000'],
    autosave_latency: ['p(95)<300'],
    submission_latency: ['p(95)<800'],
    pairing_generation_latency: ['max<10000'],
    score_recompute_latency: ['max<30000'],
  },
}

function headers(userId) {
  return { headers: { 'Content-Type': 'application/json', 'X-User-Id': userId } }
}

export function setup() {
  const suffix = `${Date.now()}`
  const instructor = 'instructor-demo'
  const classroomResponse = http.post(
    `${apiBase}/api/classrooms`,
    JSON.stringify({ name: `Load Test ${suffix}`, slug: `load-test-${suffix}`, timezone: 'Asia/Bangkok' }),
    headers(instructor),
  )
  check(classroomResponse, { 'classroom created': (response) => response.status === 201 })
  const classroom = classroomResponse.json()
  const rows = ['email,group_name,student_id,display_name,artifact_url']
  for (let index = 1; index <= 200; index += 1) {
    const group = `Group-${Math.ceil(index / 5)}`
    rows.push(`load-${suffix}-${index}@uni.example,${group},${index},Load Student ${index},https://example.com/${group}`)
  }
  const rosterResponse = http.post(
    `${apiBase}/api/classrooms/${classroom.id}/roster:import`,
    { file: http.file(rows.join('\n'), 'roster.csv', 'text/csv') },
    { headers: { 'X-User-Id': instructor } },
  )
  check(rosterResponse, { '200-student roster imported': (response) => response.status === 201 })
  const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const assignmentResponse = http.post(
    `${apiBase}/api/classrooms/${classroom.id}/assignments`,
    JSON.stringify({
      name: 'Scale validation', deadline, groupMaxScore: 20, individualMaxScore: 0,
      criterionName: 'Quality', criterionPrompt: 'ผลงานกลุ่มใดมีคุณภาพดีกว่า?',
    }),
    headers(instructor),
  )
  const assignment = assignmentResponse.json()
  const publishResponse = http.post(
    `${apiBase}/api/assignments/${assignment.id}:publish`, JSON.stringify({}), headers(instructor),
  )
  pairingLatency.add(publishResponse.timings.duration)
  check(publishResponse, { 'pair generation succeeded': (response) => response.status === 201 })
  const users = http.get(`${apiBase}/api/demo/users`).json()
    .filter((user) => user.email.startsWith(`load-${suffix}-`))
    .sort((left, right) => Number(left.email.split('-').pop().split('@')[0]) - Number(right.email.split('-').pop().split('@')[0]))
  return { assignmentId: assignment.id, users: users.map((user) => user.id), instructor }
}

export default function (data) {
  const userId = data.users[(__VU - 1) % data.users.length]
  const evaluation = http.get(
    `${apiBase}/api/assignments/${data.assignmentId}/my-evaluations?side=GROUP`, headers(userId),
  )
  evaluationLatency.add(evaluation.timings.duration)
  const evaluationLoaded = check(evaluation, { 'evaluation loads': (response) => response.status === 200 })
  if (!evaluationLoaded) return
  const pairs = evaluation.json().pairs
  if (!pairs.length) return
  // Keep 200 students active concurrently while reflecting the time needed to
  // inspect a pair. A deterministic spread avoids the unrealistic case where
  // every student clicks autosave in the same millisecond.
  const thinkTimeSeconds = 3 + ((__VU * 37) % 100) / 20
  sleep(thinkTimeSeconds)
  const save = http.put(
    `${apiBase}/api/comparisons/${pairs[0].id}`,
    JSON.stringify({ choice: 3, timeOnTaskMs: Math.round(thinkTimeSeconds * 1000) }),
    headers(userId),
  )
  autosaveLatency.add(save.timings.duration)
  check(save, { 'autosave succeeds': (response) => response.status === 200 })
  const submissionHeaders = headers(userId)
  submissionHeaders.headers['Idempotency-Key'] = `${__VU}-${__ITER}-${Date.now()}`
  const submission = http.post(
    `${apiBase}/api/assignments/${data.assignmentId}/submissions`,
    JSON.stringify({ side: 'GROUP' }),
    submissionHeaders,
  )
  submissionLatency.add(submission.timings.duration)
  check(submission, { 'submission succeeds': (response) => response.status === 201 })
}

export function teardown(data) {
  const recompute = http.get(
    `${apiBase}/api/assignments/${data.assignmentId}/reports/group`, headers(data.instructor),
  )
  recomputeLatency.add(recompute.timings.duration)
  check(recompute, { 'score recompute succeeds': (response) => response.status === 200 })
}
