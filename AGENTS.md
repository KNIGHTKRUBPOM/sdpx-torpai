# AGENTS.md

## Project
PairEval is a mobile-first university web application for collecting pairwise evaluations and turning submitted comparisons into explainable scores. Product intent and scope live in `memory-bank/intent.md`.

## Setup & Commands
- Install frontend: `cd frontend && npm ci`
- Install backend: `python -m pip install -r requirements.txt`
- Run frontend: `cd frontend && npm run dev`
- Run backend: `cd backend && python -m uvicorn main:app --reload`
- Test frontend: `cd frontend && npm test`
- Test backend: `cd backend && python -m pytest -q`
- Run E2E smoke tests: `cd frontend && npm run test:e2e`
- Lint frontend: `cd frontend && npm run lint`
- Build frontend: `cd frontend && npm run build`

## Conventions
- Frontend uses TypeScript strict mode, React function components, and Tailwind CSS.
- Backend uses Python 3.11+ type hints, Pydantic validation, and `Decimal` for score calculations.
- Domain calculations must be deterministic and isolated from HTTP/database concerns.
- Prefer accessible roles and labels; use `data-testid` only when a stable role or label is unavailable.
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
- Work on `feature/*` branches and open pull requests into `develop` when the team workflow is available.

## Rules for agents
- Read `memory-bank/intent.md` and the affected unit brief before changing domain behavior.
- Run the relevant test, lint, and build commands before proposing a completed change.
- If a test fails, fix production code; never weaken or delete a test just to make the suite pass.
- Never commit secrets. Use environment variables and keep only key names in `.env.example`.
- Do not silently change scoring or pairing policy; record the decision and update tests first.
- Keep changes focused and preserve traceability from backlog story to API and test plan.
