import { useEffect, useState, type FormEvent } from 'react'
import { ApiError, api } from '../api'
import type { Book } from '../types'

export function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { setBooks(await api.books()) }
    catch (reason) { setMessage(reason instanceof ApiError ? reason.message : 'โหลดรายการหนังสือไม่สำเร็จ') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setBusy(true); setMessage('')
    try { const book = await api.addBook({ isbn: String(data.get('isbn')), title: String(data.get('title')), author: String(data.get('author')), category: String(data.get('category')) }); setMessage(`เพิ่ม “${book.title}” เข้าคลังสำเร็จ`); form.reset(); await load() }
    catch (reason) { setMessage(reason instanceof ApiError ? reason.message : 'เพิ่มหนังสือไม่สำเร็จ') }
    finally { setBusy(false) }
  }

  async function deleteBook(book: Book) {
    if (!window.confirm(`ลบ “${book.title}” ออกจากคลังใช่หรือไม่?`)) return
    setDeletingId(book.id); setMessage('')
    try { await api.deleteBook(book.id); setMessage(`ลบ “${book.title}” ออกจากคลังสำเร็จ`); await load() }
    catch (reason) { setMessage(reason instanceof ApiError ? reason.message : 'ลบหนังสือไม่สำเร็จ') }
    finally { setDeletingId('') }
  }

  return <><div className="page-title"><div><span className="eyebrow">LIBRARIAN DESK</span><h1>จัดการหนังสือ</h1><p>เพิ่มหรือลบรายการในคลัง โดยหนังสือที่กำลังถูกยืมจะลบไม่ได้</p></div></div>
    <section className="panel form-panel"><form onSubmit={submit}><div className="form-grid"><label>ชื่อหนังสือ<input name="title" required /></label><label>ผู้แต่ง<input name="author" required /></label><label>หมวดหมู่<input name="category" required /></label><label>ISBN<input name="isbn" required placeholder="ISBN-10 หรือ ISBN-13" /></label></div><button className="button primary" disabled={busy}>{busy ? 'กำลังบันทึก…' : 'เพิ่มหนังสือเข้าคลัง'}</button></form></section>
    {message && <div className={`alert ${message.includes('สำเร็จ') ? 'success' : 'error'}`} role="status">{message}</div>}
    <div className="section-heading"><div><span className="eyebrow">BOOK INVENTORY</span><h2>จัดการหนังสือ</h2></div><span>{books.length} รายการ</span></div>
    {loading ? <div className="empty">กำลังโหลดหนังสือ…</div> : <div className="table-wrap"><table><thead><tr><th>หนังสือ</th><th>หมวดหมู่</th><th>สถานะ</th><th></th></tr></thead><tbody>{books.map((book) => <tr key={book.id}><td><strong>{book.title}</strong><small>{book.author} · ISBN {book.isbn}</small></td><td>{book.category}</td><td><span className={`badge ${book.status}`}>{book.status === 'available' ? 'พร้อมยืม' : 'กำลังถูกยืม'}</span></td><td><button className="button danger" disabled={book.status === 'borrowed' || deletingId === book.id} title={book.status === 'borrowed' ? 'ต้องรับคืนหนังสือก่อนลบ' : undefined} onClick={() => void deleteBook(book)}>{deletingId === book.id ? 'กำลังลบ…' : 'ลบ'}</button></td></tr>)}</tbody></table>{books.length === 0 && <div className="empty">ยังไม่มีหนังสือในคลัง</div>}</div>}
  </>
}
