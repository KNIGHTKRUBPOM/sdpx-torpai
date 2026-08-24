# Tech Stack

## Decision Summary

- Team: TorPai
- Domain: Pairwise student evaluation (PairEval)
- Decision date: 2026-08-19
- Source: PairEval PRD v2.0

The existing FastAPI + React stack is retained during the domain refactor. This keeps the verified workshop tooling and avoids an unrelated framework migration.

## Frontend

- Framework: React 19 + Vite
- Language: TypeScript in strict mode
- Styling: Tailwind CSS 4
- Rationale: fast feedback, typed UI state, responsive evaluation flow, and an existing working scaffold

## Backend

- Framework: FastAPI
- Language: Python 3.11+ with type hints
- Validation: Pydantic 2
- Rationale: explicit API contracts and isolated, testable scoring/pairing services

## Database

- Target: PostgreSQL
- WS-03 implementation: repository interfaces plus in-memory fakes/demo state
- Rationale: relational integrity fits classrooms, rosters, pair assignments, comparison revisions, scores, and append-only audit records

## Deployment

- Target: Vercel (frontend) + Render (backend), or university-approved infrastructure
- Staging URL: pending account/hosting connection
- Commit-to-live time: pending the first PairEval deployment measurement

## AI Tools

- Agent: Codex
- Review policy: every AI-generated change must remain traceable to a PRD rule and be explainable before commit

## Scoring precision

Business calculations use Python `Decimal`. API values may be serialized as JSON numbers/strings at boundaries, but score snapshots must not depend on binary floating-point behavior.
