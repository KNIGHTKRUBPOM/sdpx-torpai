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

## Out of Scope through WS-03

- LMS/LTI integration, native mobile application, multi-language UI, and Bradley–Terry/Elo models
- Production Google OIDC configuration, university roster integration, email delivery, and PostgreSQL migration
- Final-grade automation, XLSX generation, appeals workflow, and production load/security certification

## Open Product Decisions

The implementation follows PRD defaults for OQ-1 through OQ-8. Before M2, the instructor must explicitly decide score floor, participation scope, withdrawal handling, and time-on-task privacy policy.

## Status

In progress — WS-03 walking skeleton and unit-test harness
