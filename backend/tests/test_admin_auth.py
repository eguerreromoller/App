"""Admin auth + workshop CRUD tests for Vitrina Automotriz.

BASE_URL is derived from the frontend EXPO_PUBLIC_BACKEND_URL (public ingress).
Login uses application/x-www-form-urlencoded per FastAPI OAuth2PasswordRequestForm.
"""
import os
import pytest
import requests
from pathlib import Path

# Read the public backend URL from the frontend .env (single source of truth)
FRONTEND_ENV = Path("/app/frontend/.env")
BASE_URL = None
for line in FRONTEND_ENV.read_text().splitlines():
    if line.startswith("EXPO_PUBLIC_BACKEND_URL="):
        BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
        break
assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL not found in /app/frontend/.env"

ADMIN_EMAIL = "contacto@vitrinaautomotriz.cl"
ADMIN_PASSWORD = "Qwerqwer11"
OLD_ADMIN_PASSWORD = "1713132"

SAMPLE_PAYLOAD = {
    "name": "TEST_Taller Pytest",
    "category": "frenos",
    "description": "Taller creado por pytest para validar CRUD admin.",
    "address": "Av. Testing 123",
    "comuna": "Providencia",
    "region": "Región Metropolitana",
    "phone": "+56911112222",
    "whatsapp": "+56911112222",
    "email": "test@test.cl",
    "website": "https://example.com",
    "image_url": "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=800",
    "services": ["Frenos", "Pastillas"],
    "hours": {"Lunes-Viernes": "09:00 - 18:00"},
    "is_featured": False,
}


@pytest.fixture(scope="module")
def s():
    ses = requests.Session()
    return ses


@pytest.fixture(scope="module")
def token(s):
    r = s.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    body = r.json()
    assert "access_token" in body and body.get("token_type") == "bearer"
    assert body.get("email") == ADMIN_EMAIL
    return body["access_token"]


# ---- Auth ----
def test_login_wrong_password(s):
    r = s.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": ADMIN_EMAIL, "password": "wrong-pass"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )
    assert r.status_code == 401


def test_login_old_password_rejected(s):
    """Old password 1713132 should no longer work; new is Qwerqwer11."""
    r = s.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": ADMIN_EMAIL, "password": OLD_ADMIN_PASSWORD},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )
    assert r.status_code == 401


def test_login_wrong_email(s):
    r = s.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": "nobody@example.com", "password": ADMIN_PASSWORD},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )
    assert r.status_code == 401


def test_me_without_token(s):
    r = s.get(f"{BASE_URL}/api/auth/me", timeout=15)
    assert r.status_code == 401


def test_me_with_token(s, token):
    r = s.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == ADMIN_EMAIL
    assert data["role"] == "admin"


def test_me_with_invalid_token(s):
    r = s.get(
        f"{BASE_URL}/api/auth/me",
        headers={"Authorization": "Bearer this.is.not.a.jwt"},
        timeout=15,
    )
    assert r.status_code == 401


# ---- Protected workshop CRUD ----
def test_create_workshop_without_token(s):
    r = s.post(f"{BASE_URL}/api/workshops", json=SAMPLE_PAYLOAD, timeout=15)
    assert r.status_code == 401


def test_update_workshop_without_token(s):
    r = s.put(f"{BASE_URL}/api/workshops/does-not-matter", json=SAMPLE_PAYLOAD, timeout=15)
    assert r.status_code == 401


def test_delete_workshop_without_token(s):
    r = s.delete(f"{BASE_URL}/api/workshops/does-not-matter", timeout=15)
    assert r.status_code == 401


def test_full_crud_with_token(s, token):
    headers = {"Authorization": f"Bearer {token}"}

    # Create
    cr = s.post(f"{BASE_URL}/api/workshops", json=SAMPLE_PAYLOAD, headers=headers, timeout=15)
    assert cr.status_code == 200, cr.text
    created = cr.json()
    wid = created["id"]
    assert created["name"] == SAMPLE_PAYLOAD["name"]
    assert created["category"] == SAMPLE_PAYLOAD["category"]
    assert "_id" not in created

    try:
        # GET to verify persistence
        gr = s.get(f"{BASE_URL}/api/workshops/{wid}", timeout=15)
        assert gr.status_code == 200
        assert gr.json()["name"] == SAMPLE_PAYLOAD["name"]

        # Update
        updated_payload = {**SAMPLE_PAYLOAD, "name": "TEST_Taller Pytest Editado", "is_featured": True}
        ur = s.put(
            f"{BASE_URL}/api/workshops/{wid}",
            json=updated_payload,
            headers=headers,
            timeout=15,
        )
        assert ur.status_code == 200, ur.text
        updated = ur.json()
        assert updated["name"] == "TEST_Taller Pytest Editado"
        assert updated["is_featured"] is True

        # Verify update persisted
        gr2 = s.get(f"{BASE_URL}/api/workshops/{wid}", timeout=15)
        assert gr2.status_code == 200
        assert gr2.json()["name"] == "TEST_Taller Pytest Editado"
        assert gr2.json()["is_featured"] is True

        # Update non-existent -> 404
        nf = s.put(
            f"{BASE_URL}/api/workshops/nonexistent-id-xyz",
            json=SAMPLE_PAYLOAD,
            headers=headers,
            timeout=15,
        )
        assert nf.status_code == 404
    finally:
        # Delete
        dr = s.delete(f"{BASE_URL}/api/workshops/{wid}", headers=headers, timeout=15)
        assert dr.status_code == 200
        assert dr.json().get("deleted") is True

        # Verify deletion
        after = s.get(f"{BASE_URL}/api/workshops/{wid}", timeout=15)
        assert after.status_code == 404
