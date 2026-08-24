# Unit: Classroom & Assignment

## Purpose

Manage classroom roster context and the draft-to-published assignment lifecycle that gates pair generation.

## Responsibilities

- Create classroom and validate/import roster data atomically.
- Maintain role and classroom scope boundaries.
- Create draft assignments with artifacts, deadlines, score split, and criteria.
- Validate criterion weights and feasibility before publish.

## NOT Responsible For

- Pair allocation details, comparison scoring, or report rendering.

## Dependencies

- Depends on: authorization and persistence adapters
- Used by: Pairing Engine, Evaluation Flow, reports

## Key Business Rules

- `CLASS-01`: one invalid roster row rejects the entire import and reports its row number.
- `CLASS-02`: duplicate/invalid email, blank group, and group size below two are rejected.
- `ASSIGN-01`: criteria/roster changes are allowed only while an assignment is `DRAFT`.
- `ASSIGN-02`: group and individual criterion weights each total 100% for enabled sides.
- `ASSIGN-03`: publishing generates and stores pairs; no runtime pairing is allowed.
- `AUTHZ-01`: every resource access is authorized by role and classroom scope on the server.

## Key Stories

- `US-01` Create a classroom
- `US-02` Import a roster atomically
- `US-03` Configure an assignment and criteria

## Bolt Type

- [x] DDD Construction
- [ ] Simple Construction
