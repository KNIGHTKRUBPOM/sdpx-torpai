from __future__ import annotations

import os

import uvicorn


def main() -> None:
    # Initialize schema/seed exactly once before Uvicorn starts worker processes.
    # Child processes inherit this flag and only serve requests.
    import main as application  # noqa: F401

    os.environ["SKIP_DATABASE_INITIALIZATION"] = "1"
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        workers=int(os.getenv("WEB_CONCURRENCY", "6")),
    )


if __name__ == "__main__":
    main()
