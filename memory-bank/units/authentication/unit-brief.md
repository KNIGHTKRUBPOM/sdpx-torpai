# Unit: Authentication

## Purpose
Identify students and librarians and enforce role-based access on every protected API.

## Responsibilities
- Register student accounts with unique student ID/email.
- Verify password hashes and issue 12-hour JWT access tokens.
- Resolve the current user and enforce student/librarian permissions server-side.

## NOT Responsible For
- Email verification, password reset, OAuth, or account administration.

## Key Business Rules
- Public registration always creates role `student`; clients cannot submit a role.
- Emails are trimmed and lowercased; passwords are stored only as Argon2 hashes.
- Adding books/listing all loans requires librarian role.
- Borrowing requires student role; returns require the loan owner or a librarian.

## Key Stories
[#8 Register](https://github.com/KNIGHTKRUBPOM/sdpx-torpai/issues/8), [#9 Login](https://github.com/KNIGHTKRUBPOM/sdpx-torpai/issues/9), and [#16 librarian authorization](https://github.com/KNIGHTKRUBPOM/sdpx-torpai/issues/16).
