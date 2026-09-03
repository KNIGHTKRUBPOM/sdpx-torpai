from __future__ import annotations

from sqlalchemy import Engine, inspect, text


ASSIGNMENT_COLUMNS = {
    "individual_deadline": "TIMESTAMP WITH TIME ZONE NULL",
    "target_coverage": "INTEGER NOT NULL DEFAULT 5",
    "max_workload": "INTEGER NOT NULL DEFAULT 8",
    "min_comparisons": "INTEGER NOT NULL DEFAULT 3",
    "score_floor": "NUMERIC(4,3) NOT NULL DEFAULT 0.600",
    "score_ceiling": "NUMERIC(4,3) NOT NULL DEFAULT 1.000",
    "completion_threshold": "NUMERIC(4,3) NOT NULL DEFAULT 0.900",
    "instructor_weight": "NUMERIC(6,3) NOT NULL DEFAULT 1.000",
    "scoring_formula_version": "VARCHAR(32) NOT NULL DEFAULT 'v2.0'",
    "finalized_at": "TIMESTAMP WITH TIME ZONE NULL",
}

SUBMISSION_COLUMNS = {"metadata_json": "TEXT NOT NULL DEFAULT '{}'"}
NOTIFICATION_COLUMNS = {"dedupe_key": "VARCHAR(200) NULL"}
AUDIT_COLUMNS = {
    "assignment_id": "VARCHAR(64) NULL",
    "before_json": "TEXT NOT NULL DEFAULT '{}'",
    "after_json": "TEXT NOT NULL DEFAULT '{}'",
    "reason": "TEXT NULL",
    "ip_address": "VARCHAR(80) NULL",
}


def migrate_existing_schema(engine: Engine) -> None:
    """Apply additive schema changes while preserving existing Docker volume data."""
    inspector = inspect(engine)
    if "assignments" not in inspector.get_table_names():
        return
    assignment_columns = {column["name"] for column in inspector.get_columns("assignments")}
    membership_columns = {column["name"] for column in inspector.get_columns("classroom_memberships")}
    submission_columns = {column["name"] for column in inspector.get_columns("submission_revisions")}
    audit_columns = {column["name"] for column in inspector.get_columns("audit_records")}
    notification_columns = {column["name"] for column in inspector.get_columns("notifications")}
    with engine.begin() as connection:
        for name, sql_type in ASSIGNMENT_COLUMNS.items():
            if name not in assignment_columns:
                connection.execute(text(f'ALTER TABLE assignments ADD COLUMN "{name}" {sql_type}'))
        if "status" not in membership_columns:
            connection.execute(
                text("ALTER TABLE classroom_memberships ADD COLUMN status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE'")
            )
        for name, sql_type in SUBMISSION_COLUMNS.items():
            if name not in submission_columns:
                connection.execute(text(f'ALTER TABLE submission_revisions ADD COLUMN "{name}" {sql_type}'))
        for name, sql_type in AUDIT_COLUMNS.items():
            if name not in audit_columns:
                connection.execute(text(f'ALTER TABLE audit_records ADD COLUMN "{name}" {sql_type}'))
        for name, sql_type in NOTIFICATION_COLUMNS.items():
            if name not in notification_columns:
                connection.execute(text(f'ALTER TABLE notifications ADD COLUMN "{name}" {sql_type}'))
        connection.execute(
            text("CREATE UNIQUE INDEX IF NOT EXISTS ix_notifications_dedupe_key ON notifications (dedupe_key)")
        )

        if engine.dialect.name == "postgresql":
            preparer = engine.dialect.identifier_preparer
            for foreign_key in inspect(connection).get_foreign_keys("pair_assignments"):
                constrained = set(foreign_key.get("constrained_columns") or [])
                name = foreign_key.get("name")
                if name and constrained.intersection({"item_a_id", "item_b_id", "display_left_item_id"}):
                    quoted = preparer.quote(name)
                    connection.execute(text(f"ALTER TABLE pair_assignments DROP CONSTRAINT IF EXISTS {quoted}"))
            connection.execute(
                text(
                    """
                    CREATE OR REPLACE FUNCTION prevent_audit_mutation() RETURNS trigger AS $$
                    BEGIN
                        RAISE EXCEPTION 'audit_records is append-only';
                    END;
                    $$ LANGUAGE plpgsql
                    """
                )
            )
            connection.execute(text("DROP TRIGGER IF EXISTS audit_records_no_update ON audit_records"))
            connection.execute(text("DROP TRIGGER IF EXISTS audit_records_no_delete ON audit_records"))
            connection.execute(
                text(
                    "CREATE TRIGGER audit_records_no_update BEFORE UPDATE ON audit_records "
                    "FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation()"
                )
            )
            connection.execute(
                text(
                    "CREATE TRIGGER audit_records_no_delete BEFORE DELETE ON audit_records "
                    "FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation()"
                )
            )
        elif engine.dialect.name == "sqlite":
            connection.execute(
                text(
                    "CREATE TRIGGER IF NOT EXISTS audit_records_no_update BEFORE UPDATE ON audit_records "
                    "BEGIN SELECT RAISE(ABORT, 'audit_records is append-only'); END"
                )
            )
            connection.execute(
                text(
                    "CREATE TRIGGER IF NOT EXISTS audit_records_no_delete BEFORE DELETE ON audit_records "
                    "BEGIN SELECT RAISE(ABORT, 'audit_records is append-only'); END"
                )
            )
