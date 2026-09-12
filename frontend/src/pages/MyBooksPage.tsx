import { useEffect, useState } from 'react'
import { ApiError, api } from '../api'
import type { Loan } from '../types'

const formatDate = (value: string) => new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(new Date(value))

export function MyBooksPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const load = async () => { setLoading(true); try { setLoans(await api.myLoans()) } catch (reason) { setMessage(reason instanceof ApiError ? reason.message : 'โหลดรายการไม่สำเร็จ') } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])
  async function returnBook(loan: Loan) {
    try { await api.returnLoan(loan.id); setMessage(`คืน “${loan.book.title}” สำเร็จ`); await load() }
    catch (reason) { setMessage(reason instanceof ApiError ? reason.message : 'คืนหนังสือไม่สำเร็จ') }
  }
  return <><div className="page-title"><div><span className="eyebrow">MY LIBRARY</span><h1>หนังสือของฉัน</h1><p>ติดตามรายการที่กำลังยืมและกำหนดคืน</p></div><div className="count-card"><strong>{loans.length}</strong><span>กำลังยืม</span></div></div>
    {message && <div className={`alert ${message.includes('สำเร็จ') ? 'success' : 'error'}`} role="status">{message}</div>}
    {loading ? <div className="empty">กำลังโหลด…</div> : loans.length === 0 ? <div className="empty"><strong>ยังไม่มีหนังสือที่กำลังยืม</strong><span>ไปที่หน้าค้นหาหนังสือเพื่อเริ่มต้น</span></div> : <div className="loan-list">{loans.map((loan) => <article className="loan-row" key={loan.id}><div className="mini-cover">{loan.book.title.slice(0, 1)}</div><div><h3>{loan.book.title}</h3><p>{loan.book.author} · ISBN {loan.book.isbn}</p></div><div className="due"><span>กำหนดคืน</span><strong>{formatDate(loan.due_at)}</strong></div><button className="button danger" onClick={() => void returnBook(loan)}>คืนหนังสือ</button></article>)}</div>}
  </>
}
