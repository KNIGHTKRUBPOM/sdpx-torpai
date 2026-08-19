# Unit: Evaluation Flow

## Purpose

Provide an accessible mobile-first workflow for reviewing artifacts, autosaving forced-choice answers, and submitting the latest evaluation revision.

## Responsibilities

- Present all six text-labelled choices with no neutral option.
- Show criterion and total progress.
- Save answer drafts idempotently and submit the latest revision.
- Restore draft answers and make the screen read-only after deadline.
- Announce save state accessibly.

## NOT Responsible For

- Pair allocation, score calculation, or exposing evaluator identity.

## Dependencies

- Depends on: API layer, pairing assignments, assignment lifecycle
- Used by: student and instructor evaluator journeys

## Key Business Rules

- `EVAL-01`: every choice has an accessible textual label.
- `EVAL-02`: drafts never contribute to scoring until submitted.
- `EVAL-03`: repeated saves of the same answer are idempotent.
- `EVAL-04`: re-submission before deadline preserves revision history and uses the latest revision.
- `EVAL-05`: evaluator identity is never included in student-facing score payloads.

## Key Stories

- `US-06` Complete pairwise evaluation
- `US-07` Resume, submit, and re-submit an evaluation

## Bolt Type

- [ ] DDD Construction
- [x] Simple Construction
