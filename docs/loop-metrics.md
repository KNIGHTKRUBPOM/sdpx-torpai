# Loop Metrics — WS-06

Record measurements from actual GitHub Actions runs. Do not treat estimates as CI results.

| Measure | Before GitHub CI/CD | After GitHub CI/CD |
|---|---|---|
| Backend unit suite | 0.90 s, historical local baseline in `docs/test-loop-latency.md` | 4 s for the pytest and coverage step in PR #24 |
| Frontend component suite | 2.27 s, historical local baseline in `docs/test-loop-latency.md` | 2 s for the Vitest step in PR #24 |
| Full-stack E2E | 3.0 s for 4 Playwright cases on the local Docker stack (2026-09-22); container build/startup excluded | 2m 17s for the E2E job; 2m 9s for the Docker Compose step including image pull/build |
| Total pipeline | No GitHub pipeline | 2m 57s for PR #24; both required CI jobs passed |
| Commit to staging live | Staging not connected | Pending first successful deployment |
| Deployments per week | Staging not connected | Pending one week of deployment history |

## Evidence

- Successful PR pipeline: https://github.com/KNIGHTKRUBPOM/sdpx-torpai/actions/runs/35668037706
- Artifacts in that run: `test-results-35668037706` and `playwright-report-35668037706`.
- Staging frontend domain reserved: https://unilib-staging.vercel.app (no deployment yet)
- Staging API: https://unilib-api-rlse.onrender.com; `GET /api/health` returned HTTP 200 with `{"status":"ok"}` on 2026-09-22. The initial Render Blueprint deploy was live after 2m 01s, from `develop` commit `51a0e66` (not an Actions deployment).
- Vercel staging project has Production `VITE_API_URL=https://unilib-api-rlse.onrender.com`; its domain has no deployment yet.
- Screenshot or URL of a temporary failed-test PR whose merge button was blocked by the `main` ruleset: pending
- Slowest job/step: `e2e-tests` (2m 17s) / Docker Compose (2m 9s). Image pulls and builds dominate the step.
- Number of feature-branch pushes needed to get the first green PR pipeline: 1. Caching Docker layers would shorten the next cycle.

The pipeline measures backend tests, frontend tests, and full-stack E2E separately. Compare the local baseline with the Actions job durations only after an actual run; GitHub runner and Docker build time make the numbers different.

The GitHub account currently has collaborator access but cannot manage repository environments or rulesets. Staging secrets and variables, the production reviewer gate, and the `main` ruleset remain pending repository Admin access. Do not count the initial Blueprint deployment as commit-to-staging evidence; that metric requires a successful `develop` Actions run.
