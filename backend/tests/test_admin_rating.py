"""Tests for admin workshop CRUD with rating and review_count fields."""
import os
import pytest
import requests

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://taller-finder.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "contacto@vitrinaautomotriz.cl"
ADMIN_PASSWORD = "Qwerqwer11"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(
        f"{API}/auth/login",
        data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def created_ids():
    return []


def _payload(**overrides):
    base = {
        "name": "TEST_Rating Workshop",
        "category": "mecanica-general",
        "description": "Test taller for rating field",
        "address": "Av. Test 1234",
        "comuna": "Providencia",
        "phone": "+56222220000",
        "image_url": "https://images.unsplash.com/photo-1615906655593-ad0386982a0f?q=80&w=800",
        "services": ["Test"],
        "hours": {"Lunes-Viernes": "09:00 - 18:00"},
        "rating": 4.3,
        "review_count": 27,
        "is_featured": False,
    }
    base.update(overrides)
    return base


# --- CREATE with rating/review_count persists ---
def test_create_workshop_persists_rating_and_reviews(auth_headers, created_ids):
    r = requests.post(f"{API}/workshops", json=_payload(), headers=auth_headers, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["rating"] == 4.3
    assert data["review_count"] == 27
    assert data["name"] == "TEST_Rating Workshop"
    assert "_id" not in data
    created_ids.append(data["id"])

    # GET back to confirm persistence
    g = requests.get(f"{API}/workshops/{data['id']}", timeout=15)
    assert g.status_code == 200
    body = g.json()
    assert body["rating"] == 4.3
    assert body["review_count"] == 27


# --- UPDATE rating/review_count via PUT ---
def test_update_workshop_updates_rating_and_reviews(auth_headers, created_ids):
    r = requests.post(f"{API}/workshops", json=_payload(name="TEST_Update Rating"), headers=auth_headers, timeout=15)
    assert r.status_code == 200
    wid = r.json()["id"]
    created_ids.append(wid)

    updated = _payload(name="TEST_Update Rating", rating=3.9, review_count=88)
    u = requests.put(f"{API}/workshops/{wid}", json=updated, headers=auth_headers, timeout=15)
    assert u.status_code == 200, u.text
    body = u.json()
    assert body["rating"] == 3.9
    assert body["review_count"] == 88

    # Verify via GET
    g = requests.get(f"{API}/workshops/{wid}", timeout=15)
    assert g.status_code == 200
    got = g.json()
    assert got["rating"] == 3.9
    assert got["review_count"] == 88


# --- Defaults kick in when rating omitted ---
def test_create_workshop_defaults_when_rating_omitted(auth_headers, created_ids):
    p = _payload(name="TEST_Defaults Rating")
    p.pop("rating", None)
    p.pop("review_count", None)
    r = requests.post(f"{API}/workshops", json=p, headers=auth_headers, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["rating"] == 4.5  # default
    assert data["review_count"] == 0  # default
    created_ids.append(data["id"])


# --- PUT requires auth ---
def test_put_requires_auth():
    r = requests.put(f"{API}/workshops/anything", json=_payload(), timeout=15)
    assert r.status_code == 401


# --- Search endpoint works (used by admin dashboard) ---
def test_search_by_name(auth_headers):
    r = requests.get(f"{API}/workshops", timeout=15)
    assert r.status_code == 200
    all_ws = r.json()
    assert len(all_ws) >= 12
    # backend search param (frontend does client-side, but validate endpoint)
    r2 = requests.get(f"{API}/workshops", params={"search": "Andes"}, timeout=15)
    assert r2.status_code == 200
    assert any("Andes" in w["name"] for w in r2.json())


# --- Cleanup test-created workshops ---
def test_zzz_cleanup(auth_headers, created_ids):
    for wid in created_ids:
        d = requests.delete(f"{API}/workshops/{wid}", headers=auth_headers, timeout=15)
        assert d.status_code == 200, f"failed to delete {wid}: {d.text}"
        # Verify deletion
        g = requests.get(f"{API}/workshops/{wid}", timeout=15)
        assert g.status_code == 404
