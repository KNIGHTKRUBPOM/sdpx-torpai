from __future__ import annotations

import argparse
import json
import time

from src.persistence.database import Base, SessionLocal, engine
from src.persistence.migrations import migrate_existing_schema
from src.services.maintenance_service import run_maintenance


def run_once() -> dict[str, int]:
    Base.metadata.create_all(bind=engine)
    migrate_existing_schema(engine)
    with SessionLocal() as session:
        return run_maintenance(session)


def main() -> None:
    parser = argparse.ArgumentParser(description="Queue reminders and auto-finalize overdue PairEval assignments.")
    parser.add_argument("--loop", action="store_true", help="Run every 15 minutes for a long-lived worker.")
    args = parser.parse_args()
    while True:
        print(json.dumps({"event": "maintenance", **run_once()}, sort_keys=True), flush=True)
        if not args.loop:
            return
        time.sleep(900)


if __name__ == "__main__":
    main()
