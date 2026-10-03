from fastapi.testclient import TestClient
from main import app
from src.logger import redact_sensitive_data


def test_redact_sensitive_data():
    sample = {
        "event": "user_login",
        "email": "student@test.local",
        "password": "secret_password",
        "token": "secret_token",
        "safe_field": "hello",
        "nested": {"authorization": "Bearer xxx", "count": 5},
    }
    redacted = redact_sensitive_data(None, None, sample)
    assert redacted["email"] == "[REDACTED]"
    assert redacted["password"] == "[REDACTED]"
    assert redacted["token"] == "[REDACTED]"
    assert redacted["safe_field"] == "hello"
    assert redacted["nested"]["authorization"] == "[REDACTED]"
    assert redacted["nested"]["count"] == 5


def test_request_logging_middleware_correlation_id():
    with TestClient(app) as client:
        # Provide incoming x-request-id
        custom_id = "test-custom-request-id-12345"
        res = client.get("/api/health", headers={"x-request-id": custom_id})
        assert res.status_code == 200
        assert res.headers.get("x-request-id") == custom_id

        # Missing incoming x-request-id -> generated UUID
        res_auto = client.get("/api/health")
        assert res_auto.status_code == 200
        assert "x-request-id" in res_auto.headers
        assert len(res_auto.headers["x-request-id"]) > 0
