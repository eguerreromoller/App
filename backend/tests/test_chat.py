"""Backend tests for Turbo AI chat endpoint (/api/chat)."""
import os
import re
import uuid
import pytest
import requests

BASE_URL = os.environ.get(
    'EXPO_PUBLIC_BACKEND_URL', 'https://taller-finder.preview.emergentagent.com'
).rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="module")
def all_workshop_ids(s):
    r = s.get(f"{API}/workshops", timeout=15)
    assert r.status_code == 200
    return {w["id"] for w in r.json()}


# Turn 1: greeting should ask for service/comuna, no recommendations
def test_chat_greeting_no_recs(s):
    session_id = f"TEST-{uuid.uuid4()}"
    r = s.post(
        f"{API}/chat",
        json={"session_id": session_id, "message": "Hola"},
        timeout=60,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert "reply" in body and isinstance(body["reply"], str) and body["reply"].strip()
    assert "recommendations" in body and isinstance(body["recommendations"], list)
    # RECS marker must be stripped from visible reply
    assert "<<RECS" not in body["reply"]
    # For a bare greeting we expect no recs yet
    assert body["recommendations"] == []


# Turn 2 same session: after providing service (frenos) and comuna (Las Condes)
def test_chat_multiturn_recommends_from_db(s, all_workshop_ids):
    session_id = f"TEST-{uuid.uuid4()}"
    # turn 1
    r1 = s.post(
        f"{API}/chat",
        json={"session_id": session_id, "message": "Hola"},
        timeout=60,
    )
    assert r1.status_code == 200
    # turn 2 – give both service and comuna
    r2 = s.post(
        f"{API}/chat",
        json={
            "session_id": session_id,
            "message": "Necesito un taller de frenos en Las Condes",
        },
        timeout=90,
    )
    assert r2.status_code == 200, r2.text
    body = r2.json()
    assert body["reply"].strip()
    assert "<<RECS" not in body["reply"]
    recs = body["recommendations"]
    assert isinstance(recs, list) and len(recs) >= 1, f"Expected recommendations, got: {body}"
    # every recommendation must resolve to a real workshop id in the DB
    for w in recs:
        assert "_id" not in w
        assert w["id"] in all_workshop_ids, f"Invented workshop id: {w['id']}"
        for f in ["name", "comuna", "category", "image_url", "phone", "rating"]:
            assert f in w
    # Ideally includes 'Frenos Seguros Las Condes'
    names = [w["name"] for w in recs]
    # Not a strict assert (LLM may pick differently), just record
    print("Recommended:", names)


# Marker never leaks
def test_chat_marker_never_in_reply(s):
    session_id = f"TEST-{uuid.uuid4()}"
    r = s.post(
        f"{API}/chat",
        json={
            "session_id": session_id,
            "message": "Recomiéndame un taller de pintura en Providencia",
        },
        timeout=90,
    )
    assert r.status_code == 200
    body = r.json()
    assert not re.search(r"<<RECS:[^>]*>>", body["reply"])
