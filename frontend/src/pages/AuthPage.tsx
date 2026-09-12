import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ApiError } from '../api'
import { useAuth } from '../auth'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/catalog" replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); setBusy(true); setError('')
    try {
      if (mode === 'login') await login(String(data.get('email')), String(data.get('password')))
      else await register({ student_id: String(data.get('student_id')), name: String(data.get('name')), email: String(data.get('email')), password: String(data.get('password')) })
      navigate('/catalog')
    } catch (reason) { setError(reason instanceof ApiError ? reason.message : 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง') }
    finally { setBusy(false) }
  }

  return <main className="auth-shell">
    <section className="auth-copy"><div className="eyebrow">UNILIB CAMPUS LIBRARY</div><h1>หนังสือดี ๆ<br />อยู่ใกล้กว่าที่คิด</h1><p>ค้นหา ยืม และคืนหนังสือได้จากทุกที่ พร้อมติดตามกำหนดคืนในบัญชีเดียว</p><div className="feature-row"><span>✓ ยืมออนไลน์</span><span>✓ กำหนดคืนชัดเจน</span><span>✓ ข้อมูลเรียลไทม์</span></div></section>
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="logo-mark">📖</div><div className="eyebrow">ยินดีต้อนรับสู่ UniLib</div><h2 id="auth-title">{mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชีนักศึกษา'}</h2><p>{mode === 'login' ? 'ใช้บัญชีมหาวิทยาลัยของคุณ' : 'กรอกข้อมูลเพื่อเริ่มใช้บริการห้องสมุด'}</p>
      <form onSubmit={submit}>
        {mode === 'register' && <><label>รหัสนักศึกษา<input name="student_id" minLength={5} required placeholder="เช่น 65010001" /></label><label>ชื่อ-นามสกุล<input name="name" minLength={2} required placeholder="ชื่อที่ใช้ในมหาวิทยาลัย" /></label></>}
        <label>Email<input name="email" type="email" required placeholder="name@university.ac.th" /></label>
        <label>Password<input name="password" type="password" minLength={mode === 'register' ? 8 : 1} required placeholder="อย่างน้อย 8 ตัวอักษร" /></label>
        {error && <div className="alert error" role="alert">{error}</div>}
        <button className="button primary wide" disabled={busy}>{busy ? 'กำลังดำเนินการ…' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</button>
      </form>
      <p className="auth-switch">{mode === 'login' ? <>ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link></> : <>มีบัญชีแล้ว? <Link to="/login">เข้าสู่ระบบ</Link></>}</p>
    </section>
  </main>
}
