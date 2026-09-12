# 📐 Component Diagram - SDPX Torpai (ต่อไป)

เอกสารสรุปสถาปัตยกรรมและไดอะแกรมคอมโพเนนต์ (Component Diagram) ของระบบ **SDPX - Torpai (ระบบยืม-คืนหนังสือ)** ในรูปแบบ **Mermaid Diagram**

---

## 📊 Overview Component Diagram

```mermaid
graph TB
    subgraph Client ["Client Layer"]
        User["User Browser"]
    end

    subgraph Frontend ["Frontend Application (React 19 + TypeScript + Vite)"]
        UI_App["App Component (App.tsx)"]
        
        subgraph UI_Modules ["UI Modules"]
            SearchMod["Search & Catalog Component"]
            BorrowMod["Borrow Book Component"]
            ReturnMod["Return Book Component"]
            MyBooksMod["My Books Component"]
        end
        
        API_Client["API Client / Fetch Service"]
        
        UI_App --> SearchMod
        UI_App --> BorrowMod
        UI_App --> ReturnMod
        UI_App --> MyBooksMod
        
        SearchMod --> API_Client
        BorrowMod --> API_Client
        ReturnMod --> API_Client
        MyBooksMod --> API_Client
    end

    subgraph Backend ["Backend Service (FastAPI + Python)"]
        FastAPI_App["FastAPI Application (main.py)"]
        
        subgraph Controllers ["API Routers / Endpoints"]
            RootEP["GET / (Root / Health)"]
            BookEP["/api/books (Book Catalog API)"]
            BorrowEP["/api/borrow (Borrow API)"]
            ReturnEP["/api/return (Return API)"]
        end
        
        subgraph Logic ["Services & Models"]
            Schemas["Pydantic Schemas (Validation)"]
            BorrowService["Borrow & Return Business Logic"]
            BookService["Book Management Service"]
        end
        
        FastAPI_App --> RootEP
        FastAPI_App --> BookEP
        FastAPI_App --> BorrowEP
        FastAPI_App --> ReturnEP
        
        BookEP --> BookService
        BorrowEP --> BorrowService
        ReturnEP --> BorrowService
        
        BookService --> Schemas
        BorrowService --> Schemas
    end

    subgraph Database ["Database Layer (Planned)"]
        DB[("PostgreSQL Database")]
    end

    subgraph Tooling ["Testing & Code Quality"]
        Oxlint["Oxlint (Linter)"]
        Vitest["Vitest (Frontend Tests)"]
        Pytest["Pytest (Backend Tests)"]
    end

    User -->|"HTTP / REST (Port 5173)"| UI_App
    API_Client -->|"HTTP / REST API (Port 8000)"| FastAPI_App
    BookService -.->|"SQL Queries (ORM / Asyncpg)"| DB
    BorrowService -.->|"SQL Queries (ORM / Asyncpg)"| DB
```

---

## 🧩 คำอธิบายส่วนประกอบหลัก (Component Description)

### 1. **Client Layer**
- **User Browser**: ผู้ใช้งานเข้าถึงระบบผ่านเว็บเบราว์เซอร์เพื่อใช้งานระบบยืม-คืนหนังสือ

### 2. **Frontend Application (`/frontend`)**
- **App Component (`App.tsx`)**: คอมโพเนนต์หลักที่ควบคุม State และ Navigation ของแท็บหลัก (Search, Borrow, Return, My Books)
- **UI Modules**:
  - **Search & Catalog Component**: ระบบค้นหา Filter ตามหมวดหมู่ และแสดงรายการหนังสือ
  - **Borrow Book Component**: ฟอร์มรับรหัสนักศึกษาและ ISBN เพื่อทำรายการยืมหนังสือ
  - **Return Book Component**: ฟอร์มทำรายการคืนหนังสือ
  - **My Books Component**: แสดงรายการหนังสือที่ผู้ใช้กำลังยืมและกำหนดส่ง
- **API Client**: Service สำหรับยิง HTTP REST Requests ไปยัง FastAPI Backend

### 3. **Backend Service (`/backend`)**
- **FastAPI Application (`main.py`)**: เซิร์ฟเวอร์หลักรันด้วย Uvicorn ทำหน้าที่รับ-ส่ง HTTP REST Requests
- **API Routers / Endpoints**:
  - `GET /`: Health Check Endpoint
  - `/api/books`: ดึงข้อมูลและค้นหาหนังสือ
  - `/api/borrow`: จัดการธุรกรรมการยืมหนังสือ
  - `/api/return`: จัดการธุรกรรมการคืนหนังสือ
- **Services & Models**:
  - **Pydantic Schemas**: ตรวจสอบความถูกต้องของข้อมูล (Data Validation)
  - **Business Logic**: คำนวณวันกำหนดส่ง ตรวจสอบสถานะความพร้อมของหนังสือ และปรับปรุงสถานะ

### 4. **Database Layer (Planned)**
- **PostgreSQL**: ฐานข้อมูลเชิงสัมพันธ์สำหรับจัดเก็บข้อมูลหนังสือ ข้อมูลสมาชิก และประวัติการยืม-คืน

---

## 📄 การใช้งานและการอ่านไฟล์โดย AI
ไฟล์นี้ตั้งอยู่ที่ `docs/component-diagram.md` อยู่ภายใต้ระบบ Version Control (Git) ช่วยให้ทีมพัฒนาและ AI Agents สามารถทำความเข้าใจสถาปัตยกรรมของโปรเจกต์ได้อย่างรวดเร็ว
