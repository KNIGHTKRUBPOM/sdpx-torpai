from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_root_endpoint_describes_pair_eval_service():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "service": "PairEval API",
        "version": "0.3.0",
        "status": "ok",
        "mode": "demo",
    }
    assert response.headers["X-Request-ID"]


def test_demo_feasibility_exposes_reduced_coverage_reason():
    response = client.get("/api/assignments/demo-assignment/feasibility")

    assert response.status_code == 200
    body = response.json()
    assert body["targetCoverage"] == 5
    assert body["actualCoverage"] == 4
    assert body["workload"] == 1
    assert body["reduced"] is True


def test_unknown_assignment_uses_stable_error_envelope():
    response = client.get("/api/assignments/missing/feasibility")

    assert response.status_code == 404
    body = response.json()["error"]
    assert body["code"] == "ASSIGNMENT_NOT_FOUND"
    assert body["requestId"]
