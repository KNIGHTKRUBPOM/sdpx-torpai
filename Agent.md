# PairEval — Agent Context

This compatibility file exists because earlier workshop work referenced `Agent.md`.
The authoritative repository instructions are now in [`AGENTS.md`](AGENTS.md).

## Product

PairEval helps university instructors evaluate group work and individual contribution with six-point pairwise comparisons. Students compare two items at a time; instructors retain authority to review, override, and finalize results.

## Architecture

- Frontend: React 19, TypeScript, Vite, Tailwind CSS
- Backend: FastAPI, Python, Pydantic
- Database: PostgreSQL 17 through Docker Compose; SQLite fallback for local Backend development
- Tests: Vitest, Pytest, Playwright

Run the complete local stack with `docker compose up --build -d` and open
`http://localhost:8080`.

Product decisions are documented in `memory-bank/intent.md`, and unit-level rules are in `memory-bank/units/*/unit-brief.md`.
