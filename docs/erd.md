# UniLib ER Diagram

```mermaid
erDiagram
  USER ||--o{ LOAN : borrows
  BOOK ||--o{ LOAN : has_history
  USER {
    uuid id PK
    string student_id UK
    string name
    string email UK
    text password_hash
    string role
    datetime created_at
  }
  BOOK {
    uuid id PK
    string isbn UK
    string title
    string author
    string category
    string status
    datetime created_at
    datetime deleted_at
  }
  LOAN {
    uuid id PK
    uuid user_id FK
    uuid book_id FK
    datetime borrowed_at
    datetime due_at
    datetime returned_at
  }
```

Only one loan with `returned_at IS NULL` may exist for a book. `student_id` is required for students and null for librarians. ISBN is stored without spaces or hyphens. `deleted_at` implements soft deletion so past loans keep their book information.
