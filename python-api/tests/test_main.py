from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_health_check():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_docs_are_available():
    response = client.get("/docs")

    assert response.status_code == 200


def test_predict_rejects_invalid_payload():
    response = client.post("/predict", json={"symbol": "INVALIDSYMBOL123"})

    assert response.status_code == 422
