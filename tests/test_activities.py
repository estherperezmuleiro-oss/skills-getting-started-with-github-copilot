import copy
from urllib.parse import quote

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


@pytest.fixture(autouse=True)
def reset_activities():
    # Preserve original in-memory activities and restore after each test
    orig = copy.deepcopy(app_module.activities)
    yield
    app_module.activities.clear()
    app_module.activities.update(copy.deepcopy(orig))


@pytest.fixture()
def client():
    return TestClient(app_module.app)


def test_get_activities(client):
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    assert "Chess Club" in data


def test_signup_prevents_duplicate(client):
    email = "test+signup@example.com"
    activity = "Chess Club"
    # First signup should succeed
    r1 = client.post(f"/activities/{quote(activity)}/signup", params={"email": email})
    assert r1.status_code == 200
    assert f"Signed up {email}" in r1.json()["message"]

    # Second signup should be rejected
    r2 = client.post(f"/activities/{quote(activity)}/signup", params={"email": email})
    assert r2.status_code == 400
    assert r2.json()["detail"] == "Student already registered for this activity"


def test_remove_participant(client):
    email = "test+remove@example.com"
    activity = "Art Club"

    # Ensure participant can be added
    r1 = client.post(f"/activities/{quote(activity)}/signup", params={"email": email})
    assert r1.status_code == 200

    # Now remove
    r2 = client.delete(f"/activities/{quote(activity)}/participants", params={"email": email})
    assert r2.status_code == 200
    assert f"Removed {email}" in r2.json()["message"]

    # Verify participant no longer present
    r3 = client.get("/activities")
    participants = r3.json()[activity]["participants"]
    assert email not in participants
