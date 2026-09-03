# PairEval operations runbook

## Health and observability

- `GET /health` verifies the API can query the database.
- Every response contains `X-Request-ID`; backend logs one JSON object per request with method, path, status and duration.
- Alert in the deployment platform when error rate is above 1% for 5 minutes, or API p95 is above 4 seconds for 5 minutes.
- Run `performance/paireval.js` before a release; its thresholds come directly from PRD NFR-PERF-01..05.

## Database backup and restore

Target: RPO 15 minutes, RTO 4 hours. Use managed PostgreSQL point-in-time recovery in production. For a local verification:

1. Back up: `docker compose exec -T db pg_dump -U paireval -Fc paireval > paireval.dump`
2. Start a clean validation database.
3. Restore: `pg_restore --clean --if-exists --no-owner -U paireval -d paireval paireval.dump`
4. Start the API, check `/health`, then verify classroom, assignment, submission, score snapshot and audit counts.
5. Record actual restore duration and evidence. Repeat at least once per semester.

Never commit dump files: they contain university identity and evaluation data.

## Scheduled work

The Docker `maintenance` service runs every 15 minutes. It queues one reminder for students who remain incomplete within 48 hours of the latest deadline and auto-finalizes an assignment 14 days after that deadline. Both notifications are deduplicated. Auto-finalization creates an immutable score snapshot and audit event.

## Retention and privacy

- Identity/evaluations: 2 academic years.
- Time-on-task: 1 academic year.
- Production deployment must run the approved anonymization job after those periods; do not delete aggregate academic statistics.
- Data-subject exports are available at `GET /api/me/data-export` and must be fulfilled within 30 days.

## Incident and rollback

1. Stop writes by placing the deployment in maintenance mode.
2. Preserve application logs and database evidence.
3. Roll back the application image; do not roll back an irreversible database change without a verified restore point.
4. Restore PostgreSQL to the most recent safe point when required.
5. Validate `/health`, authorization boundaries and one read-only report before reopening traffic.
