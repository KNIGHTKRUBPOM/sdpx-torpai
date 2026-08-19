# PairEval Refactor Summary — 19 August 2026

โปรเจกต์ถูกย้ายจากตัวอย่าง UniLib เดิมมาเป็น **PairEval** ตาม `project-ideas/pairwise_evaluation_prd.md` และข้อกำหนด WS-01 ถึง WS-03 โดยเก็บ stack/tooling ที่ใช้ซ้ำได้ และแทนที่ domain artifacts/implementation/tests ที่ไม่ตรงโจทย์

## สิ่งที่เก็บไว้

- React 19 + TypeScript + Vite + Tailwind CSS
- FastAPI + Python + Pydantic
- Vitest, Pytest และ Playwright
- โครง `frontend/`, `backend/`, `docs/`, `memory-bank/`

## สิ่งที่เปลี่ยน

### WS-01 — Context & deploy-ready scaffold

- เพิ่ม `AGENTS.md` ที่มี setup/commands/conventions/rules ครบ และคง `Agent.md` เป็น compatibility pointer
- อัปเดต README, tech stack, `.gitignore` และ `.env.example` เป็น PairEval
- ทำ responsive landing/evaluation prototype พร้อม nav และ main CTA
- เตรียม config สำหรับ Vercel/Render แต่ staging URL/commit-to-live time ยังรอ account connection

### WS-02 — Requirements & API design

- backlog 8 stories พร้อม Given/When/Then, Definition of Done และ trace ไป API/rules
- Component architecture และ ERD ด้วย Mermaid
- OpenAPI 3.1 จำนวน 9 operations พร้อม security scheme และ error envelope เดียวกัน
- Intent + 4 unit briefs: Classroom/Assignment, Pairing, Evaluation Flow, Scoring
- Wireframes Excalidraw 3 screens สำหรับ instructor dashboard, assignment setup และ student evaluation
- Redocly validation: ผ่านโดยไม่มี error/warning

### WS-03 — Unit-test harness & first E2E

- Pairing Engine: feasibility, deterministic seed, balanced coverage/workload, self-group exclusion และ repository boundary
- Scoring Engine: six-choice mapping, submitted-only weighted mean, band mapping, criterion weights, participation multiplier และ golden example
- Fake repository, factories และ fixtures ที่ใช้ซ้ำได้
- Backend: 23 tests ผ่าน, 90% source coverage, 1.62s
- Frontend: 3 tests ผ่าน, 7.40s ด้วย happy-dom
- Playwright: 2 smoke/flow tests ผ่านใน 2.5s
- Fidelity check: ทำลาย submitted-only filter แล้ว test แดง 1 ตัวใน 0.13s ก่อนคืน production rule

## ขอบเขตที่ยังรอหลัง WS-03

- Production Google OIDC + classroom-scoped authorization
- PostgreSQL repositories, atomic CSV roster import และ append-only audit store
- UI เชื่อม FastAPI persistence ครบทั้ง flow (prototype ปัจจุบันใช้ typed demo data)
- External staging deployment และการวัด commit-to-live time
- WS-04 integration/E2E expansion, anonymity negative tests และ accessibility/security certification
