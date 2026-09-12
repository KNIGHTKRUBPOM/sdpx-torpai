import { useEffect, useMemo, useState } from 'react'
import { ApiError, api } from '../api'
import { useAuth } from '../auth'
import type { Book } from '../types'

export function CatalogPage() {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('ทั้งหมด')
  const [status, setStatus] = useState('ทั้งหมด')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => { setLoading(true); setMessage(''); try { setBooks(await api.books()) } catch (reason) { setMessage(reason instanceof ApiError ? reason.message : 'โหลดข้อมูลไม่สำเร็จ') } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])
  const categories = useMemo(() => ['ทั้งหมด', ...Array.from(new Set(books.map((book) => book.category)))], [books])
  const filtered = useMemo(() => books.filter((book) => {
    const term = query.trim().toLowerCase()
    const matchesText = !term || [book.title, book.author, book.isbn].some((value) => value.toLowerCase().includes(term))
    return matchesText && (category === 'ทั้งหมด' || book.category === category) && (status === 'ทั้งหมด' || book.status === status)
  }), [books, category, query, status])

  async function borrow(book: Book) {
    setMessage('')
    try { await api.borrow(book.isbn); await load(); setMessage(`ยืม “${book.title}” สำเร็จ กำหนดคืนใน 14 วัน`) }
    catch (reason) { setMessage(reason instanceof ApiError ? reason.message : 'ยืมหนังสือไม่สำเร็จ') }
  }

  return <>
    <section className="hero"><div><div className="eyebrow">คลังความรู้ของมหาวิทยาลัย</div><h1>วันนี้อยากอ่าน<br /><em>เรื่องอะไร?</em></h1><p>ค้นหาหนังสือจากชื่อ ผู้แต่ง หรือ ISBN แล้วทำรายการยืมได้ทันที</p></div><div className="hero-stat"><strong>{books.filter((book) => book.status === 'available').length}</strong><span>เล่มพร้อมยืม</span></div></section>
    <section className="panel search-panel">
      <label className="search-box"><span>⌕</span><input aria-label="ค้นหาหนังสือ" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อหนังสือ ผู้แต่ง หรือ ISBN" /></label>
      <select aria-label="หมวดหมู่" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
      <select aria-label="สถานะ" value={status} onChange={(event) => setStatus(event.target.value)}><option>ทั้งหมด</option><option value="available">พร้อมยืม</option><option value="borrowed">ถูกยืม</option></select>
    </section>
    {message && <div className={`alert ${message.includes('สำเร็จ') ? 'success' : 'error'}`} role="status">{message}</div>}
    <div className="section-heading"><div><span className="eyebrow">BOOK CATALOG</span><h2>รายการหนังสือ</h2></div><span>{filtered.length} รายการ</span></div>
    {loading ? <div className="empty">กำลังโหลดหนังสือ…</div> : filtered.length === 0 ? <div className="empty">ไม่พบหนังสือที่ตรงกับคำค้นหา</div> : <section className="book-grid">{filtered.map((book, index) => <article className="book-card" key={book.id}>
      <div className={`book-cover tone-${index % 4}`}><span>{book.category}</span><strong>{book.title.slice(0, 1)}</strong></div>
      <div className="book-body"><span className={`badge ${book.status}`}>{book.status === 'available' ? 'พร้อมยืม' : 'ถูกยืมแล้ว'}</span><h3>{book.title}</h3><p>{book.author}</p><small>ISBN {book.isbn}</small>
      {user?.role === 'student' && <button className="button primary wide" disabled={book.status !== 'available'} onClick={() => void borrow(book)}>{book.status === 'available' ? 'ยืมหนังสือ' : 'ยังไม่พร้อมให้ยืม'}</button>}</div>
    </article>)}</section>}
  </>
}
