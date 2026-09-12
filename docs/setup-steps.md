# Environment Loop — WS05

## Before

Manual setup required Node, npm install, Python virtualenv, pip install, separate frontend/backend terminals, and a separately configured database: at least 8 steps and typically 15–30 minutes.

## After

1. Install and start Docker Desktop.
2. Run `docker compose up --build`.
3. Open `http://localhost:5173`.

The development database uses a named volume. The test database in `compose.test.yaml` uses `tmpfs`, so every run starts clean. There is no Compose `version` field. Both application images use pinned base tags, multi-stage builds, non-root runtime users, and health checks.

## Verification

```bash
docker compose -f compose.test.yaml up --build --abort-on-container-exit --exit-code-from e2e
```

This command runs backend tests, frontend tests, and Playwright against the complete stack. A failed prerequisite test prevents E2E from starting and produces a non-zero Compose exit code.

## Deployment loop

Connect Vercel and Render to the repository and select `develop` for automatic staging deploys. Set `VITE_API_URL` in Vercel. Set `ALLOWED_ORIGINS`, `LIBRARIAN_EMAIL`, and `LIBRARIAN_PASSWORD` in Render; `DATABASE_URL` and `JWT_SECRET` are provisioned by `render.yaml`.

- Staging frontend URL: pending Vercel account connection
- Staging API URL: pending Render account connection
- Commit-to-live time: record after the first connected deployment
