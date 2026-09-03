from __future__ import annotations

import csv
import io
import re
from collections import Counter
from dataclasses import dataclass


EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
REQUIRED_HEADERS = {"email", "group_name"}
FORMULA_PREFIXES = ("=", "+", "-", "@")


class RosterValidationError(ValueError):
    def __init__(self, errors: list[dict[str, object]]) -> None:
        super().__init__("Roster CSV contains invalid rows")
        self.errors = errors


@dataclass(frozen=True)
class RosterRow:
    row_number: int
    email: str
    group_name: str
    student_id: str | None
    display_name: str
    artifact_url: str | None


def normalize_email(value: str) -> str:
    value = value.strip().lower()
    if "@" not in value:
        return value
    local, domain = value.rsplit("@", 1)
    local = local.split("+", 1)[0]
    if domain in {"gmail.com", "googlemail.com"}:
        local = local.replace(".", "")
    return f"{local}@{domain}"


def parse_roster_csv(content: str) -> list[RosterRow]:
    reader = csv.DictReader(io.StringIO(content.lstrip("\ufeff")))
    headers = {header.strip().lower() for header in (reader.fieldnames or [])}
    missing = sorted(REQUIRED_HEADERS - headers)
    if missing:
        raise RosterValidationError(
            [{"row": 1, "field": "header", "message": f"Missing columns: {', '.join(missing)}"}]
        )

    rows: list[RosterRow] = []
    errors: list[dict[str, object]] = []
    seen: dict[str, int] = {}
    for row_number, raw in enumerate(reader, start=2):
        row = {(key or "").strip().lower(): (value or "").strip() for key, value in raw.items()}
        email = normalize_email(row.get("email", ""))
        group_name = row.get("group_name", "")
        for field in ("group_name", "student_id", "display_name", "artifact_url"):
            if row.get(field, "").startswith(FORMULA_PREFIXES):
                errors.append(
                    {"row": row_number, "field": field, "message": "Spreadsheet formula prefixes are not allowed"}
                )
        if not EMAIL_PATTERN.fullmatch(email):
            errors.append({"row": row_number, "field": "email", "message": "Invalid email address"})
        elif email in seen:
            errors.append(
                {
                    "row": row_number,
                    "field": "email",
                    "message": f"Duplicate email; first appeared at row {seen[email]}",
                }
            )
        else:
            seen[email] = row_number
        if not group_name:
            errors.append({"row": row_number, "field": "group_name", "message": "Group name is required"})
        rows.append(
            RosterRow(
                row_number=row_number,
                email=email,
                group_name=group_name,
                student_id=row.get("student_id") or None,
                display_name=row.get("display_name") or email.split("@", 1)[0],
                artifact_url=row.get("artifact_url") or None,
            )
        )

    if not rows:
        errors.append({"row": 2, "field": "file", "message": "Roster must contain at least one student"})
    group_sizes = Counter(row.group_name for row in rows if row.group_name)
    for group_name, size in group_sizes.items():
        if size < 2:
            errors.append(
                {
                    "row": next(row.row_number for row in rows if row.group_name == group_name),
                    "field": "group_name",
                    "message": f"Group '{group_name}' has {size} member; minimum is 2",
                }
            )
    if errors:
        raise RosterValidationError(errors)
    return rows
