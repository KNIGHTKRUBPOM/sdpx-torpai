# WS2 Artifact Checklist

ตรวจเทียบกับ `SDPX-AI-main/WS-02-RUN-req-design/lab.md` วันที่ 14 กันยายน 2026

| Required artifact | Status | Evidence |
|---|---|---|
| GitHub user stories at least 8 | Ready | Issues #8–#16 และ #19 รวม 10 stories |
| GitHub Project board | Needs account check | Current GitHub token lacks `read:project`; confirm To Do, In Progress and Done columns before presenting |
| Binary acceptance criteria | Ready | GitHub Issues และ `docs/requirements.md` |
| Intent | Ready | `memory-bank/intent.md` |
| At least 2 unit briefs | Ready | 5 unit briefs under `memory-bank/units/` |
| Component diagram in Mermaid | Ready | `docs/architecture.md` |
| ER diagram with PK/FK/cardinality | Ready | `docs/erd.md` |
| OpenAPI with at least 5 endpoints | Ready | `docs/openapi.yaml` |
| Auth, required fields and common errors | Ready | Bearer JWT and shared Error schema in OpenAPI |
| Story to endpoint traceability | Ready | `x-user-story` fields and `docs/requirements.md` |
| OpenAPI validation | Passed | Redocly reports valid with one intentional health-endpoint warning |

## Issues corrected during this audit

- Replaced the stale component diagram with the current React, FastAPI, services and PostgreSQL data flow.
- Replaced the old `docs/component-diagram.md` content with a pointer to the canonical diagram in `docs/architecture.md`.
- Added use-case and delete-book sequence diagrams.
- Added US-10, its measurable acceptance criteria, Definition of Done and API traceability.
- Updated the ERD and OpenAPI contract for soft deletion.

## Presenter checkpoint

- Explain one story and point to its endpoint and test.
- Explain every box and arrow in the component diagram without reading the file verbatim.
- Defend `DELETE` with `204`, `403`, `404` and `409` outcomes.
- Name one rejected AI suggestion and the concrete reason it was rejected.
