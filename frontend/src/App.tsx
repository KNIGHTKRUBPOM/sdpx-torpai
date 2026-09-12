import { useState } from 'react'

interface Book {
  id: string
  title: string
  author: string
  category: string
  isbn: string
  status: 'available' | 'borrowed'
  coverColor: string
  dueDate?: string
}

export function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'borrow' | 'return' | 'my-books'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด')
  const [studentId, setStudentId] = useState('')
  const [bookIsbn, setBookIsbn] = useState('')
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null)

  // Sample books data
  const sampleBooks: Book[] = [
    {
      id: '1',
      title: 'Introduction to Algorithms (4th Edition)',
      author: 'Thomas H. Cormen',
      category: 'วิทยาการคอมพิวเตอร์',
      isbn: '978-0262046305',
      status: 'available',
      coverColor: 'from-blue-600 to-indigo-900',
    },
    {
      id: '2',
      title: 'Artificial Intelligence: A Modern Approach',
      author: 'Stuart Russell & Peter Norvig',
      category: 'วิทยาการคอมพิวเตอร์',
      isbn: '978-0134610993',
      status: 'available',
      coverColor: 'from-purple-600 to-slate-900',
    },
    {
      id: '3',
      title: 'Principles of Physics: Global Edition',
      author: 'David Halliday',
      category: 'วิทยาศาสตร์',
      isbn: '978-1119454014',
      status: 'borrowed',
      dueDate: '25 ก.ค. 2026',
      coverColor: 'from-amber-600 to-rose-900',
    },
    {
      id: '4',
      title: 'Financial Accounting & Reporting',
      author: 'Barry Elliott',
      category: 'บริหารธุรกิจ',
      isbn: '978-1292255996',
      status: 'available',
      coverColor: 'from-emerald-600 to-teal-900',
    },
    {
      id: '5',
      title: 'Robbins & Cotran Pathologic Basis of Disease',
      author: 'Vinay Kumar',
      category: 'แพทยศาสตร์',
      isbn: '978-0323531139',
      status: 'available',
      coverColor: 'from-rose-600 to-pink-900',
    },
    {
      id: '6',
      title: 'Modern Control Engineering',
      author: 'Katsuhiko Ogata',
      category: 'วิศวกรรมศาสตร์',
      isbn: '978-0136156734',
      status: 'borrowed',
      dueDate: '28 ก.ค. 2026',
      coverColor: 'from-cyan-600 to-blue-900',
    },
  ]

  const categories = ['ทั้งหมด', 'วิทยาการคอมพิวเตอร์', 'วิศวกรรมศาสตร์', 'แพทยศาสตร์', 'บริหารธุรกิจ', 'วิทยาศาสตร์']

  const filteredBooks = sampleBooks.filter((book) => {
    const matchesCategory = selectedCategory === 'ทั้งหมด' || book.category === selectedCategory
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.includes(searchQuery)
    return matchesCategory && matchesSearch
  })

  const triggerNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleSimulateBorrow = (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId || !bookIsbn) {
      triggerNotification('กรุณากรอกรหัสนักศึกษาและรหัส ISBN ของหนังสือ', 'info')
      return
    }
    triggerNotification(`จำลองการยืมสำเร็จ! รหัสนักศึกษา ${studentId} ยืมหนังสือ ISBN: ${bookIsbn} เรียบร้อยแล้ว`, 'success')
    setBookIsbn('')
  }

  const handleSimulateReturn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookIsbn) {
      triggerNotification('กรุณากรอกรหัสบาร์โค้ด หรือ ISBN ของหนังสือที่จะคืน', 'info')
      return
    }
    triggerNotification(`จำลองการคืนสำเร็จ! รับคืนหนังสือ ISBN: ${bookIsbn} เข้าสู่ระบบแล้ว`, 'success')
    setBookIsbn('')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Prompt',sans-serif]">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-md border flex items-center gap-3 ${
              notification.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200'
            }`}
          >
            <span className="text-xl">{notification.type === 'success' ? '✅' : 'ℹ️'}</span>
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Service Name */}
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                  UniLib
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium">
                  ทีมต่อไป (TorPai)
                </span>
              </div>
              <p className="text-xs text-slate-400">ระบบยืม-คืนหนังสือดิจิทัล มหาวิทยาลัย</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'search'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              🔍 ค้นหาหนังสือ
            </button>
            <button
              onClick={() => setActiveTab('borrow')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'borrow'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              📖 ยืมหนังสือ
            </button>
            <button
              onClick={() => setActiveTab('return')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'return'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              🔄 คืนหนังสือ
            </button>
            <button
              onClick={() => setActiveTab('my-books')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'my-books'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              📋 รายการของฉัน
            </button>
          </nav>

          {/* User Auth Action Button */}
          <div className="flex items-center space-x-3">
            <button className="hidden sm:flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2 rounded-xl text-sm font-medium transition-all">
              <span>👤</span>
              <span>เข้าสู่ระบบนิสิต/นักศึกษา</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
            <span>✨</span>
            <span>ระบบบริการห้องสมุดอัตโนมัติยุคใหม่</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            ยืม-คืนหนังสือ ยุคดิจิทัล <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              สะดวก รวดเร็ว ตลอด 24 ชั่วโมง
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            ค้นหาทรัพยากรการเรียนรู้ ตำราวิชาการ และหนังสืออิเล็กทรอนิกส์ในมหาวิทยาลัย พร้อมระบบยืมและคืนผ่าน QR Code
          </p>

          {/* Statistics Bar */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-left">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
              <p className="text-xs text-slate-400">หนังสือในระบบ</p>
              <p className="text-xl font-bold text-indigo-400">120,000+ <span className="text-xs font-normal text-slate-400">เล่ม</span></p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
              <p className="text-xs text-slate-400">พร้อมยืมขณะนี้</p>
              <p className="text-xl font-bold text-emerald-400">98,450 <span className="text-xs font-normal text-slate-400">เล่ม</span></p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
              <p className="text-xs text-slate-400">จุดรับคืนอัตโนมัติ</p>
              <p className="text-xl font-bold text-purple-400">12 <span className="text-xs font-normal text-slate-400">จุดทั่ว ม.</span></p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
              <p className="text-xs text-slate-400">สมาชิกนักศึกษา</p>
              <p className="text-xl font-bold text-pink-400">24,500+ <span className="text-xs font-normal text-slate-400">คน</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Feature Placeholder Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
          
          {/* Feature Tab Navigation Header */}
          <div className="border-b border-slate-800 p-4 sm:p-6 bg-slate-900/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>⚡</span>
                <span>
                  {activeTab === 'search' && 'ค้นหารายการหนังสือในห้องสมุด (Book Catalog)'}
                  {activeTab === 'borrow' && 'ระบบบริการยืมหนังสือออนไลน์ (Quick Borrow)'}
                  {activeTab === 'return' && 'ระบบบริการคืนหนังสือออนไลน์ (Quick Return)'}
                  {activeTab === 'my-books' && 'ประวัติและรายการหนังสือที่ยืมอยู่ (My Active Loans)'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                โมดูลระบบยืม-คืนหนังสือหลักของมหาวิทยาลัย (Main Feature Service)
              </p>
            </div>

            {/* Mobile / Secondary Tabs */}
            <div className="flex sm:hidden w-full overflow-x-auto gap-2 pb-1">
              <button
                onClick={() => setActiveTab('search')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'search' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                🔍 ค้นหา
              </button>
              <button
                onClick={() => setActiveTab('borrow')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'borrow' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                📖 ยืม
              </button>
              <button
                onClick={() => setActiveTab('return')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'return' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                🔄 คืน
              </button>
              <button
                onClick={() => setActiveTab('my-books')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'my-books' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                📋 รายการของฉัน
              </button>
            </div>
          </div>

          {/* TAB 1: Search & Catalog Feature Placeholder */}
          {activeTab === 'search' && (
            <div className="p-6 sm:p-8 space-y-6">
              {/* Search Bar & Category Filter */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อหนังสือ, ผู้แต่ง, หรือ ISBN..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Books Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredBooks.map((book) => (
                  <div
                    key={book.id}
                    className="group bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Fake Book Cover Banner */}
                      <div
                        className={`h-32 rounded-lg bg-gradient-to-br ${book.coverColor} p-3 flex flex-col justify-between shadow-inner relative overflow-hidden`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/40 text-white backdrop-blur-sm">
                            {book.category}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              book.status === 'available'
                                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {book.status === 'available' ? '● พร้อมยืม' : `● ถูกยืมแล้ว (กำหนดคืน ${book.dueDate})`}
                          </span>
                        </div>
                        <div className="text-white text-xs font-medium truncate opacity-80">
                          ISBN: {book.isbn}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-slate-100 text-base group-hover:text-indigo-300 transition-colors line-clamp-2">
                          {book.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">ผู้แต่ง: {book.author}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">โซน: อาคารห้องสมุด ชั้น 3</span>
                      <button
                        onClick={() => {
                          setBookIsbn(book.isbn)
                          setActiveTab('borrow')
                          triggerNotification(`เลือกหนังสือ "${book.title}" แล้ว ดำเนินการยืมต่อ`, 'info')
                        }}
                        disabled={book.status !== 'available'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          book.status === 'available'
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {book.status === 'available' ? 'ยืมเล่มนี้' : 'ต่อคิวจอง'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Borrow Feature Placeholder */}
          {activeTab === 'borrow' && (
            <div className="p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-300 flex items-start gap-3">
                <span className="text-lg">💡</span>
                <div>
                  <p className="font-semibold text-sm text-indigo-200">ข้อแนะนำสำหรับการยืมหนังสือ</p>
                  <p className="mt-0.5">นักศึกษาสามารถยืมหนังสือได้สูงสุด 5 เล่ม เป็นเวลา 14 วัน กรุณาตรวจสอบรหัสนักศึกษาและ ISBN หนังสือให้ถูกต้องก่อนกดยืนยัน</p>
                </div>
              </div>

              <form onSubmit={handleSimulateBorrow} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    รหัสนักศึกษา / บุคลากร (Student ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="เช่น 66010001 หรือ std-66010001"
                    className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    รหัส ISBN หรือ สแกนบาร์โค้ดหนังสือ (Book ISBN / Barcode) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={bookIsbn}
                      onChange={(e) => setBookIsbn(e.target.value)}
                      placeholder="เช่น 978-0262046305"
                      className="flex-1 px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBookIsbn('978-0262046305')
                        triggerNotification('จำลองการสแกนบาร์โค้ดหนังสือสำเร็จ!', 'info')
                      }}
                      className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      📷 สแกน QR
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    เลือกระยะเวลาการยืม (Duration)
                  </label>
                  <select className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500">
                    <option value="14">14 วัน (มาตรฐานสำหรับนักศึกษาป.ตรี)</option>
                    <option value="30">30 วัน (สำหรับนักศึกษาป.โท-เอก / อาจารย์)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-500/25 transition-all"
                  >
                    ยืนยันการยืมหนังสือ (Submit Borrow)
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: Return Feature Placeholder */}
          {activeTab === 'return' && (
            <div className="p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-xs text-emerald-300 flex items-start gap-3">
                <span className="text-lg">📦</span>
                <div>
                  <p className="font-semibold text-sm text-emerald-200">จุดบริการคืนหนังสือ 24 ชั่วโมง</p>
                  <p className="mt-0.5">คุณสามารถหย่อนหนังสือที่ตู้รับคืนอัตโนมัติ (Smart Book Drop) ได้ทุกจุดทั่ว campus โดยมียืนยันผ่านรหัสบาร์โค้ดหลังเล่ม</p>
                </div>
              </div>

              <form onSubmit={handleSimulateReturn} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    เลือกจุดบริการคืนหนังสือ (Drop Location)
                  </label>
                  <select className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500">
                    <option>ตู้รับคืนอัตโนมัติ - อาคารหอสมุดกลาง (ชั้น 1)</option>
                    <option>ตู้รับคืนอัตโนมัติ - คณะวิศวกรรมศาสตร์</option>
                    <option>ตู้รับคืนอัตโนมัติ - คณะบริหารธุรกิจ</option>
                    <option>เคาน์เตอร์เจ้าหน้าที่หอสมุด (เวลาทำการ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    รหัส ISBN หรือ สแกนบาร์โค้ดหนังสือที่จะคืน *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookIsbn}
                    onChange={(e) => setBookIsbn(e.target.value)}
                    placeholder="กรอกรหัส ISBN หรือสแกนบาร์โค้ดหลังเล่ม"
                    className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    บันทึกการคืนหนังสือ (Submit Return)
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: My Active Loans Feature Placeholder */}
          {activeTab === 'my-books' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-200">รายการหนังสือที่กำลังยืมอยู่ (2 เล่ม)</h3>
                  <p className="text-xs text-slate-400">สถานะล่าสุดจากรหัสนักศึกษาตัวอย่าง</p>
                </div>
                <button
                  onClick={() => triggerNotification('ทำการต่ออายุหนังสือทุกเล่มเรียบร้อยแล้ว!', 'success')}
                  className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-medium transition-all"
                >
                  🔄 ต่ออายุหนังสือทั้งหมด (Renew All)
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-16 bg-gradient-to-br from-amber-600 to-rose-900 rounded-lg flex items-center justify-center text-xl shadow-md">
                      📕
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-200 text-sm">Principles of Physics: Global Edition</h4>
                      <p className="text-xs text-slate-400">ISBN: 978-1119454014 | วันที่ยืม: 11 ก.ค. 2026</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ⏰ กำหนดคืน: 25 ก.ค. 2026 (เหลือเวลา 4 วัน)
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => triggerNotification('ขอขยายเวลาการยืมสำเร็จ (ขยายเพิ่ม 7 วัน)', 'success')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all"
                  >
                    ต่อเวลาการยืม
                  </button>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-16 bg-gradient-to-br from-cyan-600 to-blue-900 rounded-lg flex items-center justify-center text-xl shadow-md">
                      📘
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-200 text-sm">Modern Control Engineering</h4>
                      <p className="text-xs text-slate-400">ISBN: 978-0136156734 | วันที่ยืม: 14 ก.ค. 2026</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ⏰ กำหนดคืน: 28 ก.ค. 2026 (เหลือเวลา 7 วัน)
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => triggerNotification('ขอขยายเวลาการยืมสำเร็จ (ขยายเพิ่ม 7 วัน)', 'success')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all"
                  >
                    ต่อเวลาการยืม
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/50 mt-12 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-base">📚</span>
            <span className="font-semibold text-slate-400">UniLib TorPai System</span>
            <span>- ระบบบริการยืม-คืนหนังสือสำหรับมหาวิทยาลัย</span>
          </div>
          <p>© 2026 ทีมต่อไป (TorPai) | พัฒนาด้วย React 19, TypeScript, Vite & FastAPI</p>
        </div>
      </footer>
    </div>
  )
}

export default App
