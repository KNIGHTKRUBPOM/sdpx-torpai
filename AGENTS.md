# AGENTS.md

## Project
UniLib is a mobile-first campus library application. Students register, search, borrow, return, and track books. Librarians add books and manage loans. Product intent lives in `memory-bank/intent.md`.

## Setup & Commands
- Full stack: `docker compose up --build`
- All tests: `docker compose -p unilib-test -f compose.test.yaml up --build --abort-on-container-exit --exit-code-from e2e`
- Backend: `cd backend && python -m uvicorn main:app --reload`
- Backend tests: `cd backend && python -m pytest -q`
- Frontend: `cd frontend && npm ci && npm run dev`
- Frontend checks: `cd frontend && npm test && npm run lint && npm run build`
- E2E: `cd frontend && npm run test:e2e`

## Conventions
- React function components, strict TypeScript, accessible roles/labels, and Tailwind CSS.
- FastAPI, Pydantic validation, SQLAlchemy 2, PostgreSQL, and timezone-aware UTC timestamps.
- Keep domain rules in services, HTTP mapping in routers, and persistence behind the database layer.
- Use Conventional Commits and work on `feature/*` branches into `develop`.

## Rules for agents
- Read the affected unit brief before changing domain behavior.
- Run relevant tests, lint, and build before declaring completion.
- Never weaken or delete a test just to make the suite pass.
- Never commit secrets; update `.env.example` with key names only.
- Test-only reset routes must never be registered outside `APP_ENV=test`.
- Update OpenAPI, test plan, and acceptance criteria when public behavior changes.
