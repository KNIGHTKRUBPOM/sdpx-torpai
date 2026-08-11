# Unit: API Gateway

## Purpose
เป็นสื่อกลางในการเชื่อมต่อ รับ-ส่งข้อมูล และ Routing ระหว่าง Frontend UI กับ FastAPI Backend

## Responsibilities
- กำหนด API Endpoints และ Data Contracts สำหรับ Frontend และ Backend
- แปลงและทำ Validation ข้อมูลคำขอด้วย Pydantic Schemas ก่อนส่งเข้า Business Logic
- จัดการ HTTP Error Handlers และ Status Codes (เช่น 200 OK, 400 Bad Request, 404 Not Found)

## NOT Responsible For
- การประมวลผล Business Logic ของการยืม-คืน (หน้าที่ของ `borrow-transaction`)
- การจัดการ state ในฝั่ง UI Rendering (หน้าที่ของ `book-catalog` และ `user-books`)

## Dependencies
- Depends on: FastAPI Framework, Pydantic, Vite REST Client
- Used by: `book-catalog`, `borrow-transaction`, `user-books`

## Key Business Rules
- ทุก Request/Response payload ต้องผ่านการตรวจสอบโครงสร้างตาม Pydantic Schema
- กรณีข้อมูลไม่ถูกต้องหรือหาหนังสือไม่เจอ ต้องส่ง HTTP Error Code ที่เหมาะสม (400 หรือ 404) พร้อมข้อความอธิบาย

## Key Stories
- N/A (Will link to GitHub Issues when created)

## Bolt Type
[ ] DDD Construction — ถ้า domain logic ซับซ้อน
[x] Simple Construction — ถ้าเป็น UI, integration, utility
