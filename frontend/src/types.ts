export type Role = 'student' | 'librarian'
export interface User { id: string; student_id: string | null; name: string; email: string; role: Role }
export interface Book { id: string; isbn: string; title: string; author: string; category: string; status: 'available' | 'borrowed' }
export interface Loan { id: string; borrowed_at: string; due_at: string; returned_at: string | null; book: Book; user: User }
export interface TokenResponse { access_token: string; token_type: string; user: User }
