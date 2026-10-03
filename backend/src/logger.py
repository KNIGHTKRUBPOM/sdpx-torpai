import contextvars
import logging
import sys
from typing import Any
import structlog

# Context variable for request correlation ID
request_id_var: contextvars.ContextVar[str | None] = contextvars.ContextVar("request_id", default=None)

SENSITIVE_KEYS = {
    "authorization",
    "password",
    "token",
    "access_token",
    "email",
    "secret",
    "refresh_token",
    "password_hash",
}


def redact_sensitive_data(_, __, event_dict: dict[str, Any]) -> dict[str, Any]:
    """Redact sensitive fields such as passwords, tokens, and emails from log output."""
    def _redact_value(key: str, val: Any) -> Any:
        if isinstance(key, str) and any(sens in key.lower() for sens in SENSITIVE_KEYS):
            return "[REDACTED]"
        if isinstance(val, dict):
            return {k: _redact_value(k, v) for k, v in val.items()}
        if isinstance(val, list):
            return [_redact_value(key, item) for item in val]
        return val

    return {k: _redact_value(k, v) for k, v in event_dict.items()}


def add_correlation_id(_, __, event_dict: dict[str, Any]) -> dict[str, Any]:
    """Inject current request correlation ID if available."""
    req_id = request_id_var.get()
    if req_id and "requestId" not in event_dict:
        event_dict["requestId"] = req_id
    return event_dict


def setup_logging(json_format: bool = True) -> structlog.BoundLogger:
    """Configure structlog processors and JSON/console formatting."""
    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        add_correlation_id,
        redact_sensitive_data,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    structlog.configure(
        processors=shared_processors
        + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = (
        structlog.processors.JSONRenderer()
        if json_format
        else structlog.dev.ConsoleRenderer()
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        structlog.stdlib.ProcessorFormatter(
            foreign_pre_chain=shared_processors,
            processors=[
                structlog.stdlib.ProcessorFormatter.remove_processors_meta,
                formatter,
            ],
        )
    )

    root_logger = logging.getLogger()
    root_logger.handlers = [handler]
    root_logger.setLevel(logging.INFO)

    return structlog.get_logger("unilib")


logger: structlog.BoundLogger = structlog.get_logger("unilib")
