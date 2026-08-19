# Unit: Pairing Engine

## Purpose

Calculate feasible evaluation coverage and persist deterministic, balanced pair assignments before an assignment is published.

## Responsibilities

- Solve group coverage/workload constraints from classroom size and group membership.
- Generate pair assignments with no self-group evaluation or repeated evaluator/pair combination.
- Balance pair coverage and evaluator workload.
- Randomize and store display-left position while reproducing output for a fixed seed.
- Generate individual-evaluation pairs from group membership rules.

## NOT Responsible For

- Saving comparison answers or calculating scores.
- Authenticating users or deciding classroom membership.
- Rendering the evaluation screen.

## Dependencies

- Depends on: roster data and `PairAssignmentRepository`
- Used by: assignment publish flow and coverage reports

## Key Business Rules

- `PAIR-01`: a group evaluator never receives a pair containing their own group.
- `PAIR-02`: one evaluator never receives the same unordered pair twice for one criterion/generation.
- `PAIR-03`: maximum pair coverage minus minimum pair coverage is at most one.
- `PAIR-04`: evaluator workloads differ by at most one.
- `PAIR-05`: identical seed and input produce identical assignments, including stored display side.
- `PAIR-06`: infeasible target coverage is reduced to the highest feasible value with a numeric explanation.
- `PAIR-07`: individual evaluation is disabled for groups of two or fewer; complete coverage is `m - 2` when not workload-capped.

## Key Stories

- `US-04` Preview pairing feasibility
- `US-05` Publish an assignment and generate pairs

## Bolt Type

- [x] DDD Construction
- [ ] Simple Construction
