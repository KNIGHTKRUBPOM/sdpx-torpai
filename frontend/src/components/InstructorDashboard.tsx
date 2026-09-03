import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api, ApiClientError, downloadCsv, type Assignment, type Classroom, type EvaluationSide, type Me } from '../api'
import { GovernancePanel } from './GovernancePanel'

type Summary = {
  classroom: { id: string; name: string; slug: string; timezone: string }
  studentCount: number
  groupCount: number
  assignments: Assignment[]
}

function timezoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(instant)
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]))
  return Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute, values.second) - instant.getTime()
}

function classroomLocalToIso(value: string, timeZone: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) throw new Error('กรุณาระบุวันและเวลาให้ครบ')
  const [, year, month, day, hour, minute] = match.map(Number)
  const wallClock = Date.UTC(year, month - 1, day, hour, minute)
  const first = new Date(wallClock - timezoneOffsetMs(new Date(wallClock), timeZone))
  return new Date(wallClock - timezoneOffsetMs(first, timeZone)).toISOString()
}

type Props = { me: Me; userId: string; onEvaluate: (assignmentId: string, side: EvaluationSide) => void }

type CriterionDraft = { id: string; name: string; prompt: string; weightPct: number; side: EvaluationSide }
type ReportData = {
  assignmentName: string
  group: Array<{ itemId: string; itemName: string; component: number | null; flags: string[] }>
  individual: Array<{ itemId: string; itemName: string; groupName: string; total: number | null; participationRatio: number; flags: string[] }>
  coverage: Array<{ side: EvaluationSide; criterion: string; assignedCoverage: number; submittedCoverage: number; flags: string[] }>
}

const DEFAULT_CRITERIA: CriterionDraft[] = [
  { id: 'group-default', name: 'User Experience', prompt: 'ผลงานใดออกแบบ flow และ feedback ได้ชัดเจนกว่า?', weightPct: 100, side: 'GROUP' },
  { id: 'individual-default', name: 'Teamwork', prompt: 'สมาชิกคนใดมีส่วนร่วมและทำงานร่วมกับทีมได้ดีกว่า?', weightPct: 100, side: 'INDIVIDUAL' },
]

const SAMPLE_CSV = `email,group_name,student_id,display_name,artifact_url
alpha1@university.example,Alpha,660001,Alpha One,https://example.com/alpha
alpha2@university.example,Alpha,660002,Alpha Two,https://example.com/alpha
beta1@university.example,Beta,660003,Beta One,https://example.com/beta
beta2@university.example,Beta,660004,Beta Two,https://example.com/beta
gamma1@university.example,Gamma,660005,Gamma One,https://example.com/gamma
gamma2@university.example,Gamma,660006,Gamma Two,https://example.com/gamma`

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError && Array.isArray(error.details)) {
    return `${error.message} ${(error.details as Array<{ row: number; message: string }>).map((item) => `แถว ${item.row}: ${item.message}`).join(' · ')}`
  }
  return error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
}

export function InstructorDashboard({ me, userId, onEvaluate }: Props) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [criteria, setCriteria] = useState<CriterionDraft[]>(DEFAULT_CRITERIA)
  const [report, setReport] = useState<ReportData | null>(null)
  const [governanceAssignment, setGovernanceAssignment] = useState<Assignment | null>(null)
  const selectedTimezone = classrooms.find((classroom) => classroom.id === selectedId)?.timezone || 'Asia/Bangkok'

  const updateCriterion = (id: string, update: Partial<CriterionDraft>) => {
    setCriteria((current) => current.map((criterion) => criterion.id === id ? { ...criterion, ...update } : criterion))
  }

  const addCriterion = (side: EvaluationSide) => {
    setCriteria((current) => [...current, { id: crypto.randomUUID(), name: '', prompt: '', weightPct: 0, side }])
  }

  const removeCriterion = (id: string) => setCriteria((current) => current.filter((criterion) => criterion.id !== id))

  const loadClassrooms = useCallback(async (preferred?: string) => {
    const result = await api<Classroom[]>('/api/classrooms', {}, userId)
    setClassrooms(result)
    setSelectedId((current) => preferred || current || result[0]?.id || '')
  }, [userId])

  const loadSummary = useCallback(async (classroomId: string) => {
    if (!classroomId) return setSummary(null)
    setSummary(await api<Summary>(`/api/instructor/classrooms/${classroomId}/summary`, {}, userId))
  }, [userId])

  useEffect(() => { void loadClassrooms().catch((reason) => setError(errorMessage(reason))) }, [loadClassrooms])
  useEffect(() => { void loadSummary(selectedId).catch((reason) => setError(errorMessage(reason))) }, [loadSummary, selectedId])

  const run = async (work: () => Promise<void>) => {
    setBusy(true); setError(''); setNotice('')
    try { await work() } catch (reason) { setError(errorMessage(reason)) } finally { setBusy(false) }
  }

  const createClassroom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    void run(async () => {
      const created = await api<Classroom>('/api/classrooms', {
        method: 'POST',
          body: JSON.stringify({ name: form.get('name'), slug: form.get('slug'), timezone: form.get('timezone') }),
      }, userId)
      await loadClassrooms(created.id)
      setNotice('สร้าง Classroom แล้ว ขั้นต่อไป Import roster CSV')
      formElement.reset()
    })
  }

  const importRoster = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedId) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    void run(async () => {
      const file = form.get('file')
      if (!(file instanceof File) || !file.size) throw new Error('กรุณาเลือกไฟล์ CSV')
      const body = new FormData(); body.set('file', file)
      const result = await api<{ studentCount: number; groupCount: number }>(`/api/classrooms/${selectedId}/roster:import`, { method: 'POST', body }, userId)
      await loadSummary(selectedId)
      setNotice(`Import สำเร็จแบบ atomic: ${result.studentCount} คน ${result.groupCount} กลุ่ม`)
      formElement.reset()
    })
  }

  const createAssignment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedId) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    void run(async () => {
      const groupMaxScore = Number(form.get('groupMaxScore'))
      const individualMaxScore = Number(form.get('individualMaxScore'))
      await api(`/api/classrooms/${selectedId}/assignments`, {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          description: form.get('description'),
          deadline: classroomLocalToIso(String(form.get('deadline')), selectedTimezone),
          individualDeadline: individualMaxScore > 0 ? classroomLocalToIso(String(form.get('individualDeadline') || form.get('deadline')), selectedTimezone) : null,
          groupMaxScore,
          individualMaxScore,
          scoreFloor: Number(form.get('scoreFloor')),
          scoreCeiling: 1,
          completionThreshold: Number(form.get('completionThreshold')),
          minComparisons: Number(form.get('minComparisons')),
          criteria: criteria
            .filter((criterion) => criterion.side === 'GROUP' ? groupMaxScore > 0 : individualMaxScore > 0)
            .map(({ name, prompt, weightPct, side }) => ({ name, prompt, weightPct, side })),
        }),
      }, userId)
      await loadSummary(selectedId)
      setNotice('สร้าง Assignment แบบ Draft แล้ว ตรวจ feasibility และกด Publish ได้เลย')
      formElement.reset()
      setCriteria(DEFAULT_CRITERIA)
    })
  }

  const publish = (assignmentId: string) => void run(async () => {
    const feasibility = await api<{ explanation: string }>(`/api/assignments/${assignmentId}/feasibility`, {}, userId)
    await api(`/api/assignments/${assignmentId}:publish`, { method: 'POST', body: JSON.stringify({}) }, userId)
    await loadSummary(selectedId)
    setNotice(`Publish และบันทึก pairs แล้ว: ${feasibility.explanation}`)
  })

  const loadReports = (assignment: Assignment) => void run(async () => {
    const [group, individual, coverage] = await Promise.all([
      api<{ rows: ReportData['group'] }>(`/api/assignments/${assignment.id}/reports/group`, {}, userId),
      api<{ rows: ReportData['individual'] }>(`/api/assignments/${assignment.id}/reports/individual`, {}, userId),
      api<{ rows: ReportData['coverage'] }>(`/api/assignments/${assignment.id}/reports/coverage`, {}, userId),
    ])
    setReport({ assignmentName: assignment.name, group: group.rows, individual: individual.rows, coverage: coverage.rows })
  })

  const exportReport = (assignmentId: string, reportName: 'GROUP' | 'INDIVIDUAL' | 'COVERAGE' | 'RAW') => void run(async () => {
    await downloadCsv(`/api/assignments/${assignmentId}/exports`, { format: 'CSV', report: reportName }, userId)
    setNotice(`ดาวน์โหลด ${reportName.toLowerCase()} CSV แล้ว`)
  })

  const exportXlsx = (assignmentId: string) => void run(async () => {
    await downloadCsv(`/api/assignments/${assignmentId}/exports`, { format: 'XLSX', report: 'GROUP' }, userId)
    setNotice('ดาวน์โหลด XLSX ครบ 4 sheets แล้ว')
  })

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = 'roster-example.csv'; link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 px-7 py-8 text-white shadow-xl sm:px-10">
        <p className="text-sm text-indigo-200">Instructor workspace · {me.displayName}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-4xl font-semibold">จัดเตรียม PairEval</h1><p className="mt-3 text-sm text-slate-300">สร้างห้อง → Import CSV → สร้าง Assignment → ตรวจ feasibility → Publish</p></div>
          <select aria-label="เลือก Classroom" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="min-h-12 rounded-xl border border-white/15 bg-slate-900 px-4 text-sm">
            {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}
          </select>
        </div>
      </section>
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      {busy && <p className="text-sm text-slate-500">กำลังบันทึกและตรวจสอบข้อมูล…</p>}

      <section className="grid gap-5 lg:grid-cols-3">
        <form onSubmit={createClassroom} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Step 1</p><h2 className="font-display mt-2 text-xl font-semibold">สร้าง Classroom</h2>
          <input required name="name" placeholder="ชื่อวิชา / ห้อง" className="mt-5 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-sm" />
          <input required name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="slug เช่น csx-301" className="mt-3 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-sm" />
          <input required name="timezone" defaultValue="Asia/Bangkok" aria-label="Timezone ของ Classroom" className="mt-3 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-sm" />
          <button disabled={busy} className="mt-4 min-h-12 w-full rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white">สร้างห้อง</button>
        </form>

        <form onSubmit={importRoster} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-600">Step 2</p><h2 className="font-display mt-2 text-xl font-semibold">Import Roster CSV</h2>
          <p className="mt-2 text-xs leading-5 text-slate-500">ต้องมี email, group_name และควรมี artifact_url ทุกกลุ่ม ระบบ reject ทั้งไฟล์เมื่อพบแถวผิด</p>
          <input required type="file" name="file" accept=".csv,text/csv" className="mt-5 block w-full text-sm" />
          <div className="mt-4 flex gap-2"><button disabled={busy || !selectedId} className="min-h-12 flex-1 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white">Import</button><button type="button" onClick={downloadSample} className="rounded-xl border border-slate-300 px-3 text-xs font-semibold">ไฟล์ตัวอย่าง</button></div>
        </form>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Current state</p><h2 className="font-display mt-2 text-xl font-semibold text-indigo-950">{summary?.classroom.name || 'เลือก Classroom'}</h2>
          <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white p-4"><p className="text-2xl font-semibold">{summary?.studentCount || 0}</p><p className="text-xs text-slate-500">นักศึกษา</p></div><div className="rounded-xl bg-white p-4"><p className="text-2xl font-semibold">{summary?.groupCount || 0}</p><p className="text-xs text-slate-500">กลุ่ม</p></div></div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={createAssignment} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Step 3</p><h2 className="font-display mt-2 text-xl font-semibold">สร้าง Assignment + Criterion</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><input required name="name" placeholder="ชื่อ Assignment" className="min-h-12 rounded-xl border border-slate-300 px-4 text-sm" /><label className="text-xs text-slate-500">Deadline ({selectedTimezone})<input required type="datetime-local" name="deadline" className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900" /></label></div>
          <textarea name="description" placeholder="คำอธิบาย" className="mt-3 min-h-20 w-full rounded-xl border border-slate-300 p-4 text-sm" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs text-slate-500">คะแนนเต็มกลุ่ม<input required type="number" min="0" name="groupMaxScore" defaultValue="15" className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900" /></label><label className="text-xs text-slate-500">คะแนนเต็มรายบุคคล<input required type="number" min="0" name="individualMaxScore" defaultValue="5" className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900" /></label></div>
          <label className="mt-3 block text-xs text-slate-500">Individual deadline ({selectedTimezone})<input required type="datetime-local" name="individualDeadline" className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900" /></label>
          {(['GROUP', 'INDIVIDUAL'] as const).map((side) => <fieldset key={side} className="mt-5 rounded-2xl border border-slate-200 p-4"><legend className="px-2 text-sm font-semibold">{side === 'GROUP' ? 'เกณฑ์ผลงานกลุ่ม' : 'เกณฑ์รายบุคคล'}</legend>{criteria.filter((criterion) => criterion.side === side).map((criterion) => <div key={criterion.id} className="mt-3 rounded-xl bg-slate-50 p-3"><div className="grid gap-2 sm:grid-cols-[1fr_90px]"><input required value={criterion.name} onChange={(event) => updateCriterion(criterion.id, { name: event.target.value })} aria-label={`ชื่อเกณฑ์ ${side}`} placeholder="ชื่อเกณฑ์" className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm" /><input required type="number" min="0.01" max="100" step="0.01" value={criterion.weightPct} onChange={(event) => updateCriterion(criterion.id, { weightPct: Number(event.target.value) })} aria-label={`น้ำหนักเกณฑ์ ${criterion.name || side}`} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm" /></div><textarea required value={criterion.prompt} onChange={(event) => updateCriterion(criterion.id, { prompt: event.target.value })} aria-label={`คำถามเกณฑ์ ${criterion.name || side}`} placeholder="คำถามเปรียบเทียบ" className="mt-2 min-h-20 w-full rounded-lg border border-slate-300 p-3 text-sm" /><button type="button" onClick={() => removeCriterion(criterion.id)} className="mt-2 text-xs font-semibold text-rose-600">ลบเกณฑ์</button></div>)}<button type="button" onClick={() => addCriterion(side)} className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold">+ เพิ่มเกณฑ์</button></fieldset>)}
          <details className="mt-4 rounded-xl bg-slate-50 p-4"><summary className="cursor-pointer text-sm font-semibold">ตั้งค่าสูตรตาม PRD</summary><div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="text-xs text-slate-500">Score floor<input required type="number" name="scoreFloor" min="0" max="0.99" step="0.01" defaultValue="0.60" className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3" /></label><label className="text-xs text-slate-500">Completion threshold<input required type="number" name="completionThreshold" min="0.01" max="1" step="0.01" defaultValue="0.90" className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3" /></label><label className="text-xs text-slate-500">Min comparisons<input required type="number" name="minComparisons" min="1" max="20" defaultValue="3" className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3" /></label></div></details>
          <button disabled={busy || !selectedId} className="mt-4 min-h-12 w-full rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white">สร้าง Draft</button>
        </form>

        <div className="space-y-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Step 4</p><h2 className="font-display mt-2 text-xl font-semibold">ตรวจและ Publish</h2></div>
          {summary?.assignments.map((assignment) => <article key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{assignment.name}</h3><p className="mt-1 text-xs text-slate-500">Deadline {new Date(assignment.deadline).toLocaleString('th-TH', { timeZone: summary.classroom.timezone })} ({summary.classroom.timezone})</p><p className="mt-1 text-xs text-slate-500">Group {assignment.groupMaxScore} + Individual {assignment.individualMaxScore} คะแนน</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${assignment.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : assignment.status === 'FINALIZED' ? 'bg-violet-50 text-violet-700' : 'bg-amber-50 text-amber-700'}`}>{assignment.status}</span></div><div className="mt-4 flex flex-wrap gap-2">{assignment.status === 'DRAFT' && <button type="button" disabled={busy} onClick={() => publish(assignment.id)} className="min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white">ตรวจ Feasibility และ Publish</button>}{assignment.status === 'PUBLISHED' && assignment.groupAssignedCount > 0 && <button type="button" onClick={() => onEvaluate(assignment.id, 'GROUP')} className="min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white">ประเมินในฐานะผู้สอน</button>}{assignment.status !== 'DRAFT' && <button type="button" onClick={() => loadReports(assignment)} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold">เปิดรายงาน</button>}{assignment.status !== 'DRAFT' && <button type="button" onClick={() => setGovernanceAssignment(assignment)} className="min-h-11 rounded-xl border border-violet-300 bg-violet-50 px-4 text-sm font-semibold text-violet-900">กำกับคะแนน / Audit</button>}{assignment.status !== 'DRAFT' && (['GROUP', 'INDIVIDUAL', 'COVERAGE', 'RAW'] as const).map((name) => <button key={name} type="button" onClick={() => exportReport(assignment.id, name)} className="min-h-11 rounded-xl border border-slate-300 px-3 text-xs font-semibold">CSV {name}</button>)}{assignment.status !== 'DRAFT' && <button type="button" onClick={() => exportXlsx(assignment.id)} className="min-h-11 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-xs font-semibold text-emerald-900">XLSX 4 sheets</button>}</div></article>)}
          {!summary?.assignments.length && <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">ยังไม่มี Assignment ในห้องนี้</p>}
        </div>
      </section>
      {report && <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">M2 Reports</p><h2 className="font-display mt-2 text-2xl font-semibold">{report.assignmentName}</h2></div><button type="button" onClick={() => setReport(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">ปิด</button></div><div className="mt-6 grid gap-5 lg:grid-cols-3"><div><h3 className="font-semibold">Group Summary</h3><div className="mt-3 space-y-2">{report.group.map((row) => <div key={row.itemId} className="rounded-xl bg-slate-50 p-3 text-sm"><span className="font-semibold">{row.itemName}</span><span className="float-right">{row.component?.toFixed(2) ?? '—'}</span>{row.flags.length > 0 && <p className="mt-1 text-xs text-amber-700">{row.flags.join(', ')}</p>}</div>)}</div></div><div><h3 className="font-semibold">Individual Summary</h3><div className="mt-3 max-h-80 space-y-2 overflow-auto">{report.individual.map((row) => <div key={row.itemId} className="rounded-xl bg-slate-50 p-3 text-sm"><span className="font-semibold">{row.itemName}</span><span className="float-right">{row.total?.toFixed(2) ?? '—'}</span><p className="mt-1 text-xs text-slate-500">{row.groupName} · participation {Math.round(row.participationRatio * 100)}%</p></div>)}</div></div><div><h3 className="font-semibold">Pair Coverage</h3><div className="mt-3 space-y-2"><p className="rounded-xl bg-slate-50 p-3 text-sm">ทั้งหมด {report.coverage.length} คู่</p><p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Low coverage {report.coverage.filter((row) => row.flags.length).length} คู่</p><p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Submitted {report.coverage.reduce((total, row) => total + row.submittedCoverage, 0)} / {report.coverage.reduce((total, row) => total + row.assignedCoverage, 0)}</p></div></div></div></section>}
      {governanceAssignment && <GovernancePanel assignment={governanceAssignment} userId={userId} canFinalize={classrooms.find((classroom) => classroom.id === governanceAssignment.classroomId)?.role === 'OWNER'} onClose={() => setGovernanceAssignment(null)} onChanged={() => void loadSummary(selectedId)} />}
    </div>
  )
}
