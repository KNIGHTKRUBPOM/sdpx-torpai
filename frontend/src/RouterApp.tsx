import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import { Layout } from './components/Layout'
import { AuthPage } from './pages/AuthPage'
import { CatalogPage } from './pages/CatalogPage'
import { MyBooksPage } from './pages/MyBooksPage'
import { AdminBooksPage } from './pages/AdminBooksPage'
import { AdminLoansPage } from './pages/AdminLoansPage'
import type { Role } from './types'

function Protected({ children, role }: { children: React.ReactNode; role?: Role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="screen-center">กำลังตรวจสอบ session…</div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/catalog" replace />
  return <>{children}</>
}

export default function RouterApp() {
  return <Routes>
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route element={<Protected><Layout /></Protected>}>
      <Route path="/catalog" element={<CatalogPage />} />
      <Route path="/my-books" element={<Protected role="student"><MyBooksPage /></Protected>} />
      <Route path="/admin/books" element={<Protected role="librarian"><AdminBooksPage /></Protected>} />
      <Route path="/admin/loans" element={<Protected role="librarian"><AdminLoansPage /></Protected>} />
    </Route>
    <Route path="*" element={<Navigate to="/catalog" replace />} />
  </Routes>
}
