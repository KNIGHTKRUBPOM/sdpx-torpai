# PairEval Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ CLASSROOM_MEMBER : joins
    CLASSROOM ||--o{ CLASSROOM_MEMBER : contains
    CLASSROOM ||--o{ GROUP_ENTITY : defines
    GROUP_ENTITY ||--o{ CLASSROOM_MEMBER : groups
    CLASSROOM ||--o{ ASSIGNMENT : owns
    ASSIGNMENT ||--o{ CRITERION : configures
    ASSIGNMENT ||--o{ PAIR_ASSIGNMENT : generates
    CRITERION ||--o{ PAIR_ASSIGNMENT : scopes
    USER ||--o{ PAIR_ASSIGNMENT : evaluates
    PAIR_ASSIGNMENT ||--o| COMPARISON : answers
    COMPARISON ||--o{ COMPARISON_REVISION : preserves
    ASSIGNMENT ||--o{ COMPUTED_SCORE : snapshots
    ASSIGNMENT ||--o{ AUDIT_EVENT : audits

    USER {
        uuid id PK
        string email_normalized UK
        string display_name
        string status
    }
    CLASSROOM {
        uuid id PK
        string name
        string slug UK
        string timezone
        string status
    }
    CLASSROOM_MEMBER {
        uuid id PK
        uuid classroom_id FK
        uuid user_id FK
        uuid group_id FK
        string role
    }
    GROUP_ENTITY {
        uuid id PK
        uuid classroom_id FK
        string name
    }
    ASSIGNMENT {
        uuid id PK
        uuid classroom_id FK
        string name
        string artifact_url
        decimal group_max_score
        decimal individual_max_score
        bigint pairing_seed
        string status
    }
    CRITERION {
        uuid id PK
        uuid assignment_id FK
        string side
        string name
        decimal weight_pct
    }
    PAIR_ASSIGNMENT {
        uuid id PK
        uuid assignment_id FK
        uuid criterion_id FK
        uuid evaluator_user_id FK
        uuid item_a_id
        uuid item_b_id
        uuid display_left_item_id
        int generation
    }
    COMPARISON {
        uuid id PK
        uuid pair_assignment_id FK
        int choice
        string status
        datetime saved_at
        datetime submitted_at
    }
    COMPARISON_REVISION {
        uuid id PK
        uuid comparison_id FK
        int revision_no
        int choice
        string status
    }
    COMPUTED_SCORE {
        uuid id PK
        uuid assignment_id FK
        uuid criterion_id FK
        uuid item_id
        decimal quality_index
        decimal weighted_score
        boolean is_final
    }
    AUDIT_EVENT {
        uuid id PK
        uuid assignment_id FK
        uuid actor_user_id FK
        string action
        json before_json
        json after_json
        datetime occurred_at
    }
```

Key constraints not expressible in the diagram are listed in the PRD and unit briefs: unordered pair uniqueness per evaluator/generation, submitted-only scoring, immutable final score snapshots, and append-only audit events.
