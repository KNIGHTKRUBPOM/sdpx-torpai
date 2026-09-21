# Loop Metrics — WS-06

Record measurements from actual GitHub Actions runs. Do not treat estimates as CI results.

| Measure | Before GitHub CI/CD | After GitHub CI/CD |
|---|---|---|
| Backend unit suite | 0.90 s, historical local baseline in `docs/test-loop-latency.md` | Pending first successful run |
| Frontend component suite | 2.27 s, historical local baseline in `docs/test-loop-latency.md` | Pending first successful run |
| Full-stack E2E | 3.0 s for 4 Playwright cases on the local Docker stack (2026-09-22); container build/startup excluded | Pending first successful run |
| Total pipeline | No GitHub pipeline | Pending first successful run |
| Commit to staging live | Staging not connected | Pending first successful deployment |
| Deployments per week | Staging not connected | Pending one week of deployment history |

## Evidence to add after connection

- Successful pipeline run URL: pending
- Staging frontend URL: pending
- Staging API URL and `/api/health` check: pending
- Screenshot or URL of a temporary failed-test PR whose merge button was blocked by the `main` ruleset: pending
- Slowest job/step and its duration: pending
- Number of pushes needed to debug the pipeline and what would shorten the next cycle: pending

The pipeline measures backend tests, frontend tests, and full-stack E2E separately. Compare the local baseline with the Actions job durations only after an actual run; GitHub runner and Docker build time make the numbers different.
