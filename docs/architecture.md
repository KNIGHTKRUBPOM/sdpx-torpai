# PairEval Architecture

```mermaid
flowchart LR
    Browser["Student / Instructor Browser\nReact + TypeScript"]
    Auth["Google OIDC\nproduction target"]
    API["FastAPI API Layer\nREST + JSON"]
    Authz["Authorization\nrole + classroom scope"]
    Classroom["Classroom & Assignment"]
    Pairing["Pairing Engine"]
    Evaluation["Evaluation Flow"]
    Scoring["Scoring Engine\npure Decimal functions"]
    Reports["Reports / Export"]
    DB[(PostgreSQL\ntarget)]
    Audit[(Append-only Audit Store\ntarget)]

    Browser -->|HTTPS / JSON| API
    Browser -->|OIDC| Auth
    Auth -->|verified identity| API
    API --> Authz
    Authz --> Classroom
    Authz --> Evaluation
    Authz --> Reports
    Classroom --> Pairing
    Evaluation --> Scoring
    Reports --> Scoring
    Classroom -->|repository| DB
    Pairing -->|pair assignments| DB
    Evaluation -->|drafts + revisions| DB
    Scoring -->|score snapshots| DB
    API -->|security-sensitive actions| Audit
```

## Boundaries

- FastAPI/Pydantic validates transport data; domain services never depend on HTTP objects.
- Pairing and scoring depend on repository interfaces or value objects, so WS-03 tests use in-memory fakes without a database.
- Scoring is deterministic and stateless. Final persistence stores both inputs and outputs so later formula changes remain auditable.
- Production identity and evaluator-identity reads pass through one authorization layer. The WS-03 demo mode is explicitly non-production.

## Protocols

- Browser ↔ API: HTTPS, REST, JSON; autosave uses idempotent `PUT`.
- Browser ↔ Auth: Google OAuth 2.0 / OIDC in production.
- Services ↔ PostgreSQL: parameterized repository queries in the target adapter.
- API → Audit store: append-only security events; no update/delete API.
