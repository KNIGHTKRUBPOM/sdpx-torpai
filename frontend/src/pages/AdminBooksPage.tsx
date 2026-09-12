import { useState, type FormEvent } from 'react'
import { ApiError, api } from '../api'

export function AdminBooksPage() {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setBusy(true); setMessage('')
    try { const book = await api.addBook({ isbn: String(data.get('isbn')), title: String(data.get('title')), author: String(data.get('author')), category: String(data.get('category')) }); setMessage(`เพิ่ม “${book.title}” เข้าคลังสำเร็จ`); form.reset() }
    catch (reason) { setMessage(reason instanceof ApiError ? reason.message : 'เพิ่มหนังสือไม่สำเร็จ') }
    finally { setBusy(false) }
  }
  return <><div className="page-title"><div><span className="eyebrow">LIBRARIAN DESK</span><h1>เพิ่มหนังสือ</h1><p>หนึ่ง ISBN สามารถมีได้หนึ่งรายการในระบบ</p></div></div>
    <section className="panel form-panel"><form onSubmit={submit}><div className="form-grid"><label>ชื่อหนังสือ<input name="title" required /></label><label>ผู้แต่ง<input name="author" required /></label><label>หมวดหมู่<input name="category" required /></label><label>ISBN<input name="isbn" required placeholder="ISBN-10 หรือ ISBN-13" /></label></div>{message && <div className={`alert ${message.includes('สำเร็จ') ? 'success' : 'error'}`} role="status">{message}</div>}<button className="button primary" disabled={busy}>{busy ? 'กำลังบันทึก…' : 'เพิ่มหนังสือเข้าคลัง'}</button></form></section>
  </>
}
