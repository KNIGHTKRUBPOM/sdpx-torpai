from src.config import get_settings


def test_default_origins_support_localhost_and_loopback(monkeypatch):
    monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)

    settings = get_settings()

    assert "http://localhost:5173" in settings.allowed_origins
    assert "http://127.0.0.1:5173" in settings.allowed_origins
