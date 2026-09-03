import { useEffect, useRef, useState } from 'react'
import { api, type Assignment, type ChoiceValue, type DemoUser, type EvaluationBundle, type EvaluationSide, type Me, type Notification, type Score } from './api'
import { EvaluationWorkspace } from './components/EvaluationWorkspace'
import { InstructorDashboard } from './components/InstructorDashboard'
import { LoginScreen } from './components/LoginScreen'
import { ScorePreview } from './components/ScorePreview'
import { StudentDashboard } from './components/StudentDashboard'

type View = 'dashboard' | 'evaluate' | 'score'

export function App() {
  const [userId, setUserId] = useState(() => localStorage.getItem('paireval-user') || '')
  const [me, setMe] = useState<Me | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [view, setView] = useState<View>('dashboard')
  const [selectedId, setSelectedId] = useState('')
  const [selectedSide, setSelectedSide] = useState<EvaluationSide>('GROUP')
  const [bundle, setBundle] = useState<EvaluationBundle | null>(null)
  const [answers, setAnswers] = useState<Record<string, ChoiceValue>>({})
  const [score, setScore] = useState<Score | null>(null)
  const [saveState, setSaveState] = useState('คำตอบถูกเก็บใน PostgreSQL')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [savingCount, setSavingCount] = useState(0)
  const [error, setError] = useState('')
  const [privacyBusy, setPrivacyBusy] = useState(false)
  const saveQueues = useRef(new Map<string, Promise<void>>())
  const saveVersions = useRef(new Map<string, number>())
  const failedSaves = useRef(new Set<string>())

  const loadSession = async (id: string) => {
    setLoading(true); setError('')
    try {
      const [profile, items, inbox] = await Promise.all([api<Me>('/api/me', {}, id), api<Assignment[]>('/api/assignments', {}, id), api<Notification[]>('/api/notifications', {}, id)])
      setMe(profile); setAssignments(items); setNotifications(inbox)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'เชื่อมต่อระบบไม่ได้')
      setMe(null)
    } finally { setLoading(false) }
  }

  useEffect(() => { if (userId) void loadSession(userId) }, [userId])

  const login = (user: DemoUser) => {
    localStorage.setItem('paireval-user', user.id); setUserId(user.id)
  }
  const logout = () => {
    saveQueues.current.clear(); saveVersions.current.clear(); failedSaves.current.clear(); setSavingCount(0)
    localStorage.removeItem('paireval-user'); setUserId(''); setMe(null); setAssignments([]); setNotifications([]); setView('dashboard')
  }

  const acknowledgePrivacy = async () => {
    setPrivacyBusy(true); setError('')
    try {
      await api('/api/privacy/acknowledgements', { method: 'POST', body: JSON.stringify({ noticeVersion: 'v1.0' }) }, userId)
      setMe((current) => current ? { ...current, privacyAcknowledged: true } : current)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'บันทึกการรับทราบไม่สำเร็จ')
    } finally { setPrivacyBusy(false) }
  }

  const submitAppeal = async (message: string) => {
    await api('/api/appeals', { method: 'POST', body: JSON.stringify({ assignmentId: selectedId, message }) }, userId)
  }
  const navigate = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const openEvaluation = async (assignmentId: string, side: EvaluationSide = 'GROUP') => {
    setLoading(true); setError('')
    try {
      const result = await api<EvaluationBundle>(`/api/assignments/${assignmentId}/my-evaluations?side=${side}`, {}, userId)
      saveQueues.current.clear(); saveVersions.current.clear(); failedSaves.current.clear(); setSavingCount(0)
      setSelectedId(assignmentId); setSelectedSide(side); setBundle(result)
      setAnswers(Object.fromEntries(result.pairs.filter((pair) => pair.choice).map((pair) => [pair.id, pair.choice])) as Record<string, ChoiceValue>)
      navigate('evaluate')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'โหลดคู่ประเมินไม่ได้') } finally { setLoading(false) }
  }

  const saveAnswer = (pairId: string, choice: ChoiceValue, timeOnTaskMs: number) => {
    setAnswers((current) => ({ ...current, [pairId]: choice })); setSaveState('กำลังบันทึก draft…')
    const version = (saveVersions.current.get(pairId) || 0) + 1
    saveVersions.current.set(pairId, version)
    setSavingCount((current) => current + 1)
    const previous = saveQueues.current.get(pairId) || Promise.resolve()
    const task = previous.then(async () => {
      try {
        const result = await api<{ savedAt: string }>(`/api/comparisons/${pairId}`, { method: 'PUT', body: JSON.stringify({ choice, timeOnTaskMs }) }, userId)
        failedSaves.current.delete(pairId)
        if (saveVersions.current.get(pairId) === version) {
          setSaveState(`บันทึกแล้ว เมื่อ ${new Date(result.savedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`)
        }
      } catch (reason) {
        failedSaves.current.add(pairId)
        if (saveVersions.current.get(pairId) === version) {
          setSaveState(`บันทึกไม่สำเร็จ: ${reason instanceof Error ? reason.message : 'ลองอีกครั้ง'}`)
        }
      } finally {
        setSavingCount((current) => Math.max(0, current - 1))
      }
    })
    saveQueues.current.set(pairId, task)
    void task.finally(() => {
      if (saveQueues.current.get(pairId) === task) saveQueues.current.delete(pairId)
    })
  }

  const submit = async () => {
    if (!selectedId) return
    setSubmitting(true); setError('')
    try {
      while (saveQueues.current.size > 0) {
        await Promise.all(saveQueues.current.values())
      }
      if (failedSaves.current.size > 0) throw new Error('มีคำตอบที่ยังบันทึกไม่สำเร็จ กรุณาเลือกคำตอบนั้นใหม่ก่อนส่ง')
      await api(`/api/assignments/${selectedId}/submissions`, { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ side: selectedSide }) }, userId)
      await openScore(selectedId)
      await loadSession(userId)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'ส่งไม่สำเร็จ') } finally { setSubmitting(false) }
  }

  const openScore = async (assignmentId: string) => {
    setLoading(true); setError('')
    try {
      const result = await api<Score>(`/api/assignments/${assignmentId}/my-score`, {}, userId)
      setSelectedId(assignmentId); setScore(result); navigate('score')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'โหลดคะแนนไม่ได้') } finally { setLoading(false) }
  }

  const openNotification = async (notification: Notification) => {
    await api(`/api/notifications/${notification.id}:read`, { method: 'POST', body: JSON.stringify({ read: true }) }, userId)
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item))
    if (notification.type === 'SCORES_FINALIZED') await openScore(notification.assignmentId)
    else await openEvaluation(notification.assignmentId, 'GROUP')
  }

  if (!userId || !me) {
    if (userId && loading) return <main className="grid min-h-screen place-items-center bg-slate-950 text-white">กำลังโหลด session…</main>
    return <><LoginScreen onLogin={login} />{error && <p role="alert" className="fixed bottom-4 left-4 right-4 rounded-xl bg-rose-600 p-4 text-white">{error}</p>}</>
  }

  const instructor = me.memberships.some((membership) => membership.role === 'OWNER' || membership.role === 'INSTRUCTOR')
  const selectedAssignment = assignments.find((assignment) => assignment.id === selectedId)

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-8"><button type="button" onClick={() => navigate('dashboard')} className="flex items-center gap-3 text-left"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white">P/</span><span><span className="font-display block text-lg font-semibold">PairEval</span><span className="text-[11px] text-slate-600">Production-ready flow</span></span></button><nav aria-label="เมนูหลัก" data-testid="main-nav" className="flex items-center gap-2"><button onClick={() => navigate('dashboard')} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium">ภาพรวม</button><button onClick={logout} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium">ออกจากระบบ</button></nav><div className="hidden text-right md:block"><p className="text-sm font-semibold">{me.displayName}</p><p className="text-xs text-slate-600">{instructor ? 'Instructor' : 'Student evaluator'}</p></div></div></header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {error && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
        {view === 'dashboard' && (instructor ? <InstructorDashboard me={me} userId={userId} onEvaluate={openEvaluation} /> : <StudentDashboard me={me} assignments={assignments} notifications={notifications} loading={loading} onEvaluate={openEvaluation} onScore={openScore} onNotification={openNotification} />)}
        {view === 'evaluate' && bundle && <EvaluationWorkspace bundle={bundle} answers={answers} saveState={saveState} saving={savingCount > 0} submitting={submitting} onAnswer={saveAnswer} onBack={() => navigate('dashboard')} onSubmit={submit} />}
        {view === 'score' && score && selectedAssignment && <ScorePreview assignment={selectedAssignment} score={score} onReview={() => void openEvaluation(selectedId, selectedSide)} onOverview={() => navigate('dashboard')} onAppeal={submitAppeal} />}
      </main>
      <footer className="mx-auto mt-8 max-w-7xl border-t border-slate-200 px-4 py-8 text-xs text-slate-600">PairEval M4 · Group + Individual evaluation · explainable scoring · audit และ appeals</footer>
      {me.privacyAcknowledged === false && <div role="dialog" aria-modal="true" aria-labelledby="privacy-title" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4"><section className="max-w-lg rounded-3xl bg-white p-7 shadow-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Privacy notice v1.0</p><h2 id="privacy-title" className="font-display mt-2 text-2xl font-semibold">รับทราบก่อนใช้งาน PairEval</h2><p className="mt-4 text-sm leading-6 text-slate-600">ระบบเก็บข้อมูลตัวตนและผลประเมิน 2 ปีการศึกษา และเวลาในการตอบ 1 ปีการศึกษา นักศึกษาเห็นเฉพาะผลรวม ส่วนผู้สอนเข้าถึงรายงานตามสิทธิ์ในห้องเรียน การเปิดดูตัวตนใน audit จะถูกบันทึกไว้</p><button type="button" disabled={privacyBusy} onClick={() => void acknowledgePrivacy()} className="mt-6 min-h-12 w-full rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white">{privacyBusy ? 'กำลังบันทึก…' : 'รับทราบและใช้งานต่อ'}</button></section></div>}
    </div>
  )
}

export default App
