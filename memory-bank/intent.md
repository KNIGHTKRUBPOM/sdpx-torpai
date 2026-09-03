# Intent: PairEval

## Intent Statement

Enable university instructors to collect pairwise judgments about group work and individual contribution, then turn only submitted comparisons into transparent, reproducible scores without letting the system replace academic judgment.

## Business Context

- **Problem:** absolute-score anchoring, free riders in group work, and inflated peer ratings make traditional grading inconsistent and difficult to defend.
- **Users:** classroom owners/co-teachers, teaching assistants, and students using mobile-first web screens.
- **Value:** comparisons are easier to make consistently; instructors get coverage/confidence evidence; students receive privacy-aware feedback.

## Success Criteria

- [ ] At least 90% of assigned evaluators submit all required comparisons.
- [ ] Median evaluation time stays at or below 15 minutes per assignment.
- [ ] Pair generation reports feasible coverage/workload before publish and preserves all pairing invariants.
- [ ] Scoring is reproducible and the PRD worked example remains protected by a golden unit test.
- [ ] Students cannot access evaluator identity through UI, API, or exports.

## Decisions Already Made

- Use six forced-choice options with no neutral value.
- Use score band mapping with default floor `0.60` and ceiling `1.00`; never normalize scores to sum to one.
- Compute group coverage and evaluator workload together; reduce infeasible coverage with a numeric explanation.
- Use individual coverage derived from group size (`m - 2`).
- Treat earned quality and participation as separate concerns.
- Apply the PRD default participation policy to the combined personal score until OQ-2 is resolved.
- Use float-configurable instructor weight in a weighted mean.
- Store left/right display position and make pair generation deterministic for a fixed seed.
- Keep instructor review/finalize authority and immutable calculation snapshots in the target architecture.

## Out of Scope after local M1

- LMS/LTI integration, native mobile application, multi-language UI, and Bradley–Terry/Elo models
- Production Google OIDC configuration, university roster integration, and email delivery
- Final-grade automation, XLSX generation, appeals workflow, and production load/security certification

## Open Product Decisions

The instructor confirmed on 2 September 2026 that M2 follows the PRD defaults:

- OQ-1 score floor `0.60` and ceiling `1.00`, configurable per assignment.
- OQ-2 participation multiplier applies to the combined personal score.
- OQ-4 withdrawn students are excluded from calculation and pending pairs are reassigned.
- OQ-6 time-on-task is stored with disclosure in the privacy notice.
- OQ-8 two-group classrooms remain enabled with a warning.

The same confirmation applies to the remaining PRD defaults:

- OQ-3 auto-finalize 14 days after deadline with notification when no instructor action occurs.
- OQ-5 no LMS integration in v1; use exports.
- OQ-7 co-teachers see pseudonyms rather than evaluator identities.

## Status

Local M1 complete — persistent PostgreSQL walking skeleton with Instructor/Student UI, Docker
Compose, server-side demo authorization, atomic CSV roster import, publish-time pair generation,
database-backed evaluation revisions, score preview, integration tests and Playwright E2E. Production
OIDC and external staging deployment still require university credentials/infrastructure.
