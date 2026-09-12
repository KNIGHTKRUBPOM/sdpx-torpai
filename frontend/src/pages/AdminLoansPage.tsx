import { useEffect, useState } from 'react'
import { ApiError, api } from '../api'
import type { Loan } from '../types'

const formatDate = (value: string) => new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(new Date(value))

export function AdminLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [message, setMessage] = useState('')
  const load = async () => { try { setLoans(await api.allLoans()) } catch (reason) { setMessage(reason instanceof ApiError ? reason.message : 'โหลดรายการไม่สำเร็จ') } }
  useEffect(() => { void load() }, [])
  async function returnLoan(id: string) { try { await api.returnLoan(id); setMessage('รับคืนหนังสือสำเร็จ'); await load() } catch (reason) { setMessage(reason instanceof ApiError ? reason.message : 'รับคืนไม่สำเร็จ') } }
  return <><div className="page-title"><div><span className="eyebrow">LOAN OPERATIONS</span><h1>รายการยืมทั้งหมด</h1><p>ตรวจสอบประวัติและรับคืนหนังสือแทนนักศึกษา</p></div></div>
    {message && <div className={`alert ${message.includes('สำเร็จ') ? 'success' : 'error'}`} role="status">{message}</div>}
    <div className="table-wrap"><table><thead><tr><th>หนังสือ</th><th>ผู้ยืม</th><th>กำหนดคืน</th><th>สถานะ</th><th></th></tr></thead><tbody>{loans.map((loan) => <tr key={loan.id}><td><strong>{loan.book.title}</strong><small>{loan.book.isbn}</small></td><td>{loan.user.name}<small>{loan.user.student_id ?? loan.user.email}</small></td><td>{formatDate(loan.due_at)}</td><td><span className={`badge ${loan.returned_at ? 'returned' : 'borrowed'}`}>{loan.returned_at ? 'คืนแล้ว' : 'กำลังยืม'}</span></td><td>{!loan.returned_at && <button className="button ghost" onClick={() => void returnLoan(loan.id)}>รับคืน</button>}</td></tr>)}</tbody></table>{loans.length === 0 && <div className="empty">ยังไม่มีรายการยืม</div>}</div>
  </>
}
