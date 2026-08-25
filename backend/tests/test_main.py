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


def test_seed_endpoint_populates_pairs_and_resets_state():
    response = client.post("/api/test/seed")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SEEDED"
    assert data["assignmentId"] == "demo-assignment"
    assert data["pairAssignmentsCount"] > 0

    # Ensure evaluations endpoint now returns items for student-09
    evals = client.get("/api/assignments/demo-assignment/my-evaluations", headers={"X-Demo-User": "student-09"})
    assert evals.status_code == 200
    assert len(evals.json()) > 0


def test_cleanup_endpoint_clears_seeded_state():
    # First seed
    client.post("/api/test/seed")

    # Cleanup
    response = client.post("/api/test/cleanup")
    assert response.status_code == 200
    assert response.json()["status"] == "CLEANED"

    # Evaluations should now return 409 ASSIGNMENT_NOT_PUBLISHED
    evals = client.get("/api/assignments/demo-assignment/my-evaluations", headers={"X-Demo-User": "student-09"})
    assert evals.status_code == 409
    assert evals.json()["error"]["code"] == "ASSIGNMENT_NOT_PUBLISHED"


def test_test_endpoints_disabled_in_production(monkeypatch):
    monkeypatch.setenv("NODE_ENV", "production")

    seed_resp = client.post("/api/test/seed")
    assert seed_resp.status_code == 404
    assert seed_resp.json()["error"]["code"] == "NOT_FOUND"

    clean_resp = client.post("/api/test/cleanup")
    assert clean_resp.status_code == 404
    assert clean_resp.json()["error"]["code"] == "NOT_FOUND"
