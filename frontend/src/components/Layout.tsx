import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const leave = () => { logout(); navigate('/login') }
  return <div className="app-shell">
    <header className="topbar">
      <NavLink to="/catalog" className="brand"><span>📚</span><span>UniLib<small>มหาวิทยาลัยของเรา</small></span></NavLink>
      <nav aria-label="เมนูหลัก">
        <NavLink to="/catalog">ค้นหาหนังสือ</NavLink>
        {user?.role === 'student' && <NavLink to="/my-books">หนังสือของฉัน</NavLink>}
        {user?.role === 'librarian' && <NavLink to="/admin/books">เพิ่มหนังสือ</NavLink>}
        {user?.role === 'librarian' && <NavLink to="/admin/loans">รายการยืม</NavLink>}
      </nav>
      <div className="account"><span><strong>{user?.name}</strong><small>{user?.role === 'librarian' ? 'บรรณารักษ์' : user?.student_id}</small></span><button className="button ghost" onClick={leave}>ออกจากระบบ</button></div>
    </header>
    <main className="page"><Outlet /></main>
  </div>
}
