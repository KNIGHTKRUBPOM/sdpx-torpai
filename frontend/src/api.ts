import type { Book, Loan, TokenResponse, User } from './types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const TOKEN_KEY = 'unilib_access_token'

export class ApiError extends Error {
  code: string
  status: number

  constructor(message: string, code = 'REQUEST_FAILED', status = 500) {
    super(message)
    this.code = code
    this.status = status
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get()
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: { code?: string; message?: string } }
    throw new ApiError(body.error?.message ?? 'ไม่สามารถเชื่อมต่อระบบได้', body.error?.code, response.status)
  }
  return response.json() as Promise<T>
}

export const api = {
  login: (email: string, password: string) => request<TokenResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (input: { student_id: string; name: string; email: string; password: string }) => request<TokenResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  me: () => request<User>('/api/auth/me'),
  books: () => request<Book[]>('/api/books'),
  addBook: (input: { isbn: string; title: string; author: string; category: string }) => request<Book>('/api/books', { method: 'POST', body: JSON.stringify(input) }),
  borrow: (isbn: string) => request<Loan>('/api/loans', { method: 'POST', body: JSON.stringify({ isbn }) }),
  myLoans: () => request<Loan[]>('/api/loans/me'),
  allLoans: () => request<Loan[]>('/api/loans'),
  returnLoan: (loanId: string) => request<Loan>(`/api/loans/${loanId}/return`, { method: 'POST' }),
}
