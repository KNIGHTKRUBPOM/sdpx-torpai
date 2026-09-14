import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import RouterApp from './RouterApp'
import { AuthProvider } from './auth'

const student = { id: 'student-1', student_id: '65010001', name: 'Ada Lovelace', email: 'ada@uni.ac.th', role: 'student' }

function renderApp(path = '/login') {
  return render(<MemoryRouter initialEntries={[path]}><AuthProvider><RouterApp /></AuthProvider></MemoryRouter>)
}

afterEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('authenticated application', () => {
  it('shows login and registration navigation', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: 'เข้าสู่ระบบ' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'สมัครสมาชิก' })).toHaveAttribute('href', '/register')
  })

  it('logs a student in and shows role-specific navigation', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'token', token_type: 'bearer', user: student }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] }))
    renderApp()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@uni.ac.th' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } })
    fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }))
    await waitFor(() => expect(screen.getByRole('link', { name: 'หนังสือของฉัน' })).toBeInTheDocument())
    expect(screen.queryByRole('link', { name: 'จัดการหนังสือ' })).not.toBeInTheDocument()
    expect(localStorage.getItem('unilib_access_token')).toBe('token')
  })
})
