import { useEffect, useState } from 'react'
import { api, type DemoUser } from '../api'

type Props = { onLogin: (user: DemoUser) => void }

export function LoginScreen({ onLogin }: Props) {
  const [users, setUsers] = useState<DemoUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api<DemoUser[]>('/api/demo/users')
      .then(setUsers)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false))
  }, [])

  const instructor = users.find((user) => user.role === 'OWNER' || user.role === 'INSTRUCTOR')
  const students = users.filter((user) => user.role === 'STUDENT')

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-cyan-500 p-8 sm:p-10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-950/70">PairEval Local M4</p>
            <h1 className="font-display mt-4 text-4xl font-semibold leading-tight text-slate-950">เปรียบเทียบอย่างชัดเจน<br />ให้คะแนนอย่างอธิบายได้</h1>
            <p className="mt-5 text-sm leading-7 text-slate-900/75">ระบบตัวอย่างนี้ใช้ Demo Login สำหรับ local Docker ข้อมูลทุกอย่างตั้งแต่ห้องเรียนจนถึงคำตอบเก็บใน PostgreSQL จริง</p>
          </div>
          <div className="p-7 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Demo authentication</p>
            <h2 className="font-display mt-2 text-2xl font-semibold">เลือกบทบาทเพื่อเข้าสู่ระบบ</h2>
            {loading && <p className="mt-6 text-sm text-slate-400">กำลังเชื่อมต่อ Backend และฐานข้อมูล…</p>}
            {error && <p role="alert" className="mt-6 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}
            {!loading && !error && (
              <div className="mt-7 space-y-5">
                {instructor && (
                  <button data-testid="login-instructor" type="button" onClick={() => onLogin(instructor)} className="w-full rounded-2xl bg-indigo-400 p-5 text-left text-slate-950 transition hover:-translate-y-0.5 hover:bg-indigo-300">
                    <span className="text-xs font-bold uppercase tracking-[0.16em]">Instructor</span>
                    <span className="mt-1 block text-lg font-semibold">{instructor.displayName}</span>
                    <span className="mt-1 block text-xs text-slate-950">สร้างห้อง · Import CSV · สร้างและ Publish Assignment</span>
                  </button>
                )}
                <div>
                  <label htmlFor="student-login" className="text-sm font-semibold text-slate-200">นักศึกษาตัวอย่าง</label>
                  <select id="student-login" data-testid="student-select" className="mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-slate-900 px-4 text-sm" defaultValue="">
                    <option value="" disabled>เลือกนักศึกษา</option>
                    {students.map((student) => <option key={student.id} value={student.id}>{student.displayName} · {student.email}</option>)}
                  </select>
                  <button type="button" data-testid="login-student" onClick={() => {
                    const select = document.getElementById('student-login') as HTMLSelectElement
                    const student = students.find((item) => item.id === select.value)
                    if (student) onLogin(student)
                  }} className="mt-3 min-h-12 w-full rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-semibold hover:bg-white/15">เข้าสู่ระบบนักศึกษา</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
