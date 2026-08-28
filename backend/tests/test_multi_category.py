"""Tests for multi-category (rubros) feature."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://taller-finder.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "contacto@vitrinaautomotriz.cl"
ADMIN_PASSWORD = "Qwerqwer11"


@pytest.fixture(scope="module")
def token():
    r = requests.post(
        f"{API}/auth/login",
        data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---- Category counts ----
def test_categories_counts_returns_dict():
    r = requests.get(f"{API}/categories/counts", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)
    # All 9 known keys must be present and non-negative ints
    expected_keys = {"mecanica-general", "desabolladura-pintura", "gruas", "neumaticos",
                     "lubricacion", "frenos", "lavado", "personalizacion", "distribuidores"}
    assert expected_keys.issubset(data.keys())
    for k, v in data.items():
        assert isinstance(v, int) and v >= 0


def test_lavado_has_57_carwash():
    r = requests.get(f"{API}/workshops", params={"category": "lavado"}, timeout=15)
    assert r.status_code == 200
    items = r.json()
    # Expected: 57 imported carwash. Also confirm counts endpoint matches list size
    r2 = requests.get(f"{API}/categories/counts", timeout=15)
    assert len(items) == r2.json().get("lavado")
    # Explicit expectation per problem statement
    assert len(items) >= 57, f"expected >=57 lavado, got {len(items)}"


# ---- Create workshop with multi-categories ----
@pytest.fixture(scope="module")
def created_ws(auth_headers):
    payload = {
        "name": "TEST_MultiRubro Taller",
        "category": "mecanica-general",
        "categories": ["mecanica-general", "lavado", "lubricacion"],
        "description": "Taller de prueba multi-rubro",
        "address": "Calle Test 123",
        "comuna": "Providencia",
        "phone": "+56999999999",
        "image_url": "https://example.com/x.jpg",
        "services": ["Test"],
        "hours": {"Lunes-Viernes": "09:00 - 18:00"},
    }
    r = requests.post(f"{API}/workshops", json=payload, headers=auth_headers, timeout=15)
    assert r.status_code == 200, r.text
    ws = r.json()
    yield ws
    # cleanup
    requests.delete(f"{API}/workshops/{ws['id']}", headers=auth_headers, timeout=15)


def test_multi_ws_persisted(created_ws):
    assert set(created_ws["categories"]) == {"mecanica-general", "lavado", "lubricacion"}
    assert created_ws["category"] == "mecanica-general"


@pytest.mark.parametrize("cat", ["mecanica-general", "lavado", "lubricacion"])
def test_multi_ws_appears_in_each_category(created_ws, cat):
    r = requests.get(f"{API}/workshops", params={"category": cat}, timeout=15)
    assert r.status_code == 200
    ids = [w["id"] for w in r.json()]
    assert created_ws["id"] in ids, f"missing from category={cat}"


def test_multi_ws_not_in_frenos(created_ws):
    r = requests.get(f"{API}/workshops", params={"category": "frenos"}, timeout=15)
    ids = [w["id"] for w in r.json()]
    assert created_ws["id"] not in ids


def test_search_combined_with_category(created_ws):
    r = requests.get(f"{API}/workshops", params={"search": "Multi", "category": "lavado"}, timeout=15)
    assert r.status_code == 200
    ids = [w["id"] for w in r.json()]
    assert created_ws["id"] in ids


# ---- Update categories ----
def test_update_categories_reflects_in_filters(auth_headers, created_ws):
    new_cats = ["frenos", "neumaticos"]
    payload = {
        "name": created_ws["name"],
        "category": new_cats[0],
        "categories": new_cats,
        "description": created_ws["description"],
        "address": created_ws["address"],
        "comuna": created_ws["comuna"],
        "phone": created_ws["phone"],
        "image_url": created_ws["image_url"],
        "services": created_ws["services"],
        "hours": created_ws["hours"],
    }
    r = requests.put(f"{API}/workshops/{created_ws['id']}", json=payload, headers=auth_headers, timeout=15)
    assert r.status_code == 200, r.text
    updated = r.json()
    assert set(updated["categories"]) == set(new_cats)
    # Now must appear in frenos & neumaticos, not in lavado
    for c in new_cats:
        ids = [w["id"] for w in requests.get(f"{API}/workshops", params={"category": c}, timeout=15).json()]
        assert created_ws["id"] in ids, f"missing from {c}"
    ids = [w["id"] for w in requests.get(f"{API}/workshops", params={"category": "lavado"}, timeout=15).json()]
    assert created_ws["id"] not in ids


# ---- Migration check: existing seeded still work ----
def test_seeded_workshops_have_categories_array():
    r = requests.get(f"{API}/workshops", timeout=15)
    assert r.status_code == 200
    items = r.json()
    assert len(items) > 0
    for w in items[:20]:
        assert "categories" in w
        assert isinstance(w["categories"], list)
        assert len(w["categories"]) >= 1


def test_seeded_mecanica_still_queryable():
    r = requests.get(f"{API}/workshops", params={"category": "mecanica-general"}, timeout=15)
    assert r.status_code == 200
    assert len(r.json()) >= 3  # at least the 3 seeded ones
