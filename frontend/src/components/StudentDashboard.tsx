import type { Assignment, EvaluationSide, Me, Notification } from '../api'

type Props = {
  me: Me
  assignments: Assignment[]
  notifications: Notification[]
  loading: boolean
  onEvaluate: (assignmentId: string, side: EvaluationSide) => void
  onScore: (assignmentId: string) => void
  onNotification: (notification: Notification) => void
}

export function StudentDashboard({ me, assignments, notifications, loading, onEvaluate, onScore, onNotification }: Props) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-9 text-white shadow-xl sm:px-10">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-medium text-indigo-200">สวัสดี {me.displayName}</p>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight">งานประเมินของฉัน</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">คำตอบถูกบันทึกเป็น draft ในฐานข้อมูล และใช้คำนวณคะแนนเฉพาะเมื่อกดส่งแล้ว</p>
        </div>
      </section>
      {notifications.length > 0 && <section aria-labelledby="notification-heading" className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 id="notification-heading" className="font-display text-xl font-semibold">การแจ้งเตือน</h2><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{notifications.filter((item) => !item.readAt).length} ใหม่</span></div><div className="mt-3 space-y-2">{notifications.slice(0, 5).map((notification) => <button key={notification.id} type="button" onClick={() => onNotification(notification)} className={`block w-full rounded-xl border p-4 text-left text-sm ${notification.readAt ? 'border-slate-200 text-slate-500' : 'border-indigo-200 bg-indigo-50/50 font-medium text-slate-900'}`}><span>{notification.message}</span><time className="mt-1 block text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString('th-TH')}</time></button>)}</div></section>}
      {loading && <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">กำลังโหลด Assignment…</p>}
      {!loading && assignments.length === 0 && <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">ยังไม่มี Assignment ที่เปิดให้ประเมิน</p>}
      <section className="grid gap-5 lg:grid-cols-2">
        {assignments.map((assignment) => {
          const progress = assignment.assignedCount ? Math.round((assignment.answeredCount / assignment.assignedCount) * 100) : 0
          return (
            <article key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">{assignment.classroomName}</p><h2 className="font-display mt-2 text-2xl font-semibold">{assignment.name}</h2></div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{assignment.status}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{assignment.description}</p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-indigo-500" style={{ width: `${progress}%` }} /></div>
              <div className="mt-2 flex justify-between text-xs text-slate-500"><span>{assignment.answeredCount} / {assignment.assignedCount} คู่</span><span>ครบกำหนด {new Date(assignment.deadline).toLocaleString('th-TH')}</span></div>
              <div className="mt-5 flex gap-3">
                <button data-testid="main-cta" type="button" onClick={() => onEvaluate(assignment.id, 'GROUP')} className="min-h-12 flex-1 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">กลุ่ม {assignment.groupAnsweredCount} / {assignment.groupAssignedCount}</button>
                {assignment.individualMaxScore > 0 && <button type="button" onClick={() => onEvaluate(assignment.id, 'INDIVIDUAL')} className="min-h-12 flex-1 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500">รายบุคคล {assignment.individualAnsweredCount} / {assignment.individualAssignedCount}</button>}
                <button type="button" onClick={() => onScore(assignment.id)} className="min-h-12 rounded-xl border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50">ดูคะแนน</button>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
