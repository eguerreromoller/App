"""Backend tests for Vitrina Automotriz API."""
import os
import pytest
import requests

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://taller-finder.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# --- categories ---
def test_categories_returns_9(s):
    r = s.get(f"{API}/categories", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 9
    keys = {c["key"] for c in data}
    expected = {"mecanica-general", "desabolladura-pintura", "gruas", "neumaticos",
                "lubricacion", "frenos", "lavado", "personalizacion", "distribuidores"}
    assert expected == keys
    for c in data:
        assert {"key", "name", "icon", "image_url", "description"}.issubset(c.keys())


# --- workshops list ---
def test_workshops_returns_seeded(s):
    r = s.get(f"{API}/workshops", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 12
    w = data[0]
    for f in ["id", "name", "category", "description", "phone", "image_url", "comuna", "rating"]:
        assert f in w
    assert "_id" not in w


def test_workshops_featured(s):
    r = s.get(f"{API}/workshops/featured", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert all(w["is_featured"] is True for w in data)


def test_workshops_filter_category(s):
    r = s.get(f"{API}/workshops", params={"category": "mecanica-general"}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
    assert all(w["category"] == "mecanica-general" for w in data)


def test_workshops_search_andes(s):
    r = s.get(f"{API}/workshops", params={"search": "Andes"}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
    assert any("Andes" in w["name"] for w in data)


def test_workshop_detail_by_id(s):
    r = s.get(f"{API}/workshops", timeout=15)
    wid = r.json()[0]["id"]
    r2 = s.get(f"{API}/workshops/{wid}", timeout=15)
    assert r2.status_code == 200
    body = r2.json()
    assert body["id"] == wid
    assert "_id" not in body


def test_workshop_detail_404(s):
    r = s.get(f"{API}/workshops/nonexistent-id-xyz", timeout=15)
    assert r.status_code == 404


def test_comunas_endpoint(s):
    r = s.get(f"{API}/comunas", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    # Must contain at least all seeded comunas and be sorted
    expected_subset = {"Las Condes", "Providencia", "Maipú", "Ñuñoa", "Vitacura"}
    assert expected_subset.issubset(set(data)), f"Missing comunas: {expected_subset - set(data)}"
    assert data == sorted(data), "Comunas should be sorted alphabetically"
    assert all(isinstance(c, str) and c for c in data)
