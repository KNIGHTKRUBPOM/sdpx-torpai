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
docker compose -p unilib-test -f compose.test.yaml up --build --abort-on-container-exit --exit-code-from e2e
```

This command runs backend tests, frontend tests, and Playwright against the complete stack. A failed prerequisite test prevents E2E from starting and produces a non-zero Compose exit code.

## Deployment loop

GitHub Actions (`.github/workflows/ci.yml`) checks pull requests and pushes to `develop` and `main`. A successful push to `develop` deploys staging. `main` only runs CI; there is no production deployment job.

### One-time staging setup

1. Connect Render to this GitHub repository. Create the API and PostgreSQL services from `render.yaml` on branch `develop`; leave auto-deploy **Off**. The blueprint selects Free plans; Render's Free PostgreSQL database expires after 30 days, so use staging data only and schedule renewal or a separately approved paid plan before expiry. Set `ALLOWED_ORIGINS` to the stable Vercel staging URL and set unique `LIBRARIAN_EMAIL` and `LIBRARIAN_PASSWORD`. The blueprint provisions `DATABASE_URL` and `JWT_SECRET`.
2. Create a **dedicated Vercel project for staging** from this repository root, using the root `vercel.json`. Set the Vercel Production environment variable `VITE_API_URL` to the Render staging API URL. Keep Git-triggered Vercel deployments disabled so Actions is the only deployment path. The staging project is deployed with `vercel deploy --prod`, which gives it a stable project URL; it is separate from any future production project.
3. In GitHub Settings → Environments, create `staging`. Add the secret `RENDER_API_KEY` (Render API key) and `VERCEL_TOKEN` (Vercel access token). Add the variables `RENDER_SERVICE_ID`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `STAGING_API_URL`, and `STAGING_WEB_URL`. URLs must include `https://` and have no trailing path. Keep all credential values out of the repository. GitHub Actions uses the Render service ID and API key to deploy the exact tested commit and wait for completion.
4. Create a `production` GitHub environment with required reviewers. It is a gate for a future production job; this workflow does not deploy production.
5. In GitHub Settings → Rules → Rulesets, protect `main`: require a pull request and one review, require the `lint-and-unit-test` and `e2e-tests` status checks, require branches to be up to date, and block force pushes. Enable secret scanning in Code security if available for the repository.

Pull requests receive JUnit/coverage and Playwright HTML artifacts. A failed test must block merging. After the first successful staging run, record its run URL, service URLs, timings, and evidence in `docs/loop-metrics.md`.

- Staging frontend URL: pending service connection
- Staging API URL: pending service connection
- Commit-to-live time: pending first successful deployment
