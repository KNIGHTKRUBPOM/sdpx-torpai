# syntax=docker/dockerfile:1.7
FROM python:3.12.11-slim AS builder

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    VIRTUAL_ENV=/opt/venv

RUN python -m venv "$VIRTUAL_ENV"
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

COPY requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip && pip install -r /tmp/requirements.txt

FROM python:3.12.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    WEB_CONCURRENCY=6

RUN groupadd --system paireval && useradd --system --gid paireval --home-dir /app paireval
COPY --from=builder /opt/venv /opt/venv
WORKDIR /app/backend
COPY --chown=paireval:paireval backend/ /app/backend/
USER paireval

EXPOSE 8000
CMD ["python", "-m", "src.server"]
