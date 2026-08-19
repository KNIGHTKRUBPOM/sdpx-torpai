# Unit: Scoring Engine

## Purpose

Turn submitted six-point comparisons into transparent criterion and personal scores using pure, reproducible calculations.

## Responsibilities

- Map choices 1–6 to complementary left/right points.
- Compute evaluator-weighted quality index `q` from submitted comparisons only.
- Map `q` through configurable floor/ceiling score bands.
- Apply criterion weights and side maximum score.
- Compute participation ratio and multiplier separately from earned quality.
- Flag low-confidence items when comparison count is below the configured threshold.

## NOT Responsible For

- Generating pairs, authorizing report access, or changing finalized snapshots.
- Choosing academic policy values that remain open in the PRD.

## Dependencies

- Depends on: submitted comparison data and assignment scoring configuration
- Used by: score preview, reports, recompute, and finalize flows

## Key Business Rules

- `SCORE-01`: only `SUBMITTED` comparisons contribute to `q`.
- `SCORE-02`: choice points are exactly `(1.0,0.0)` through `(0.0,1.0)` in 0.2 steps.
- `SCORE-03`: `q` is a weighted mean; instructor weight is numeric and may be fractional.
- `SCORE-04`: band mapping is `floor + (ceiling - floor) × q`.
- `SCORE-05`: criterion weights for an active side total 100% ± 0.01 before calculation/publish.
- `SCORE-06`: participation multiplier is `min(1, p / threshold)` and does not mutate the shared group component.
- `SCORE-07`: the PRD §9.5 worked example evaluates to `16.93` and `10.97` after display rounding.

## Key Stories

- `US-08` View transparent interim score and participation

## Bolt Type

- [x] DDD Construction
- [ ] Simple Construction
