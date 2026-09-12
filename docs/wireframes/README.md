# 🎨 Wireframes Overview - UniLib (ทีมต่อไป TorPai)

เอกสารโครงร่างหน้าจอหลัก 3 หน้า (Wireframes) ที่ออกแบบเพื่อใช้ประกอบการพัฒนาและการทดสอบแบบ E2E (End-to-End Testing) ด้วย Playwright

---

## 🖥️ Screen 1: Search & Catalog Landing Page
- **ไฟล์ Excalidraw:** [`screen1_search_landing.excalidraw`](file:///C:/Users/User/Desktop/SPX/sdpx-torpai/docs/wireframes/screen1_search_landing.excalidraw)
- **วัตถุประสงค์:** หน้าหลักสำหรับค้นหาหนังสือ ดูหมวดหมู่ และตรวจสอบสถานะ `Available` / `Borrowed`
- **องค์ประกอบหลัก:**
  - Header & Navigation Bar
  - Real-time Search Input Bar
  - Category Filter Pills
  - Book Card Grid Display

---

## 🖥️ Screen 2: Borrow / Return Quick Action Form
- **ไฟล์ Excalidraw:** [`screen2_borrow_return_action.excalidraw`](file:///C:/Users/User/Desktop/SPX/sdpx-torpai/docs/wireframes/screen2_borrow_return_action.excalidraw)
- **วัตถุประสงค์:** ฟอร์มยืม-คืนหนังสือดิจิทัล และระบบสแกน QR Code/Barcode
- **องค์ประกอบหลัก:**
  - Tab Switcher (ยืมหนังสือ / คืนหนังสือ)
  - Student ID input field
  - Book ISBN / Barcode input field & Scan trigger
  - Quick Action Submit Button

---

## 🖥️ Screen 3: My Books & Borrow History Dashboard
- **ไฟล์ Excalidraw:** [`screen3_my_books_dashboard.excalidraw`](file:///C:/Users/User/Desktop/SPX/sdpx-torpai/docs/wireframes/screen3_my_books_dashboard.excalidraw)
- **วัตถุประสงค์:** แดชบอร์ดตรวจสอบรายการหนังสือที่นิสิตยืมอยู่ พร้อมแจ้งกำหนดคืน และปุ่มทางลัดสำหรับคืนหนังสือ
- **องค์ประกอบหลัก:**
  - Summary Stats Cards (หนังสือที่ยืมอยู่, ครบกำหนดคืน)
  - Active Borrowed List Table/Cards
  - Direct Action Return Button
