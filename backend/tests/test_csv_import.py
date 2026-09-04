"""Tests for CSV bulk import endpoint /api/workshops/import."""
import os
import pytest
import requests

BASE_URL = "https://taller-finder.preview.emergentagent.com"
ADMIN_EMAIL = "contacto@vitrinaautomotriz.cl"
ADMIN_PASS = "Qwerqwer11"

TEST_PREFIX = "TESTCSV_"

CSV_HEADERS = "Rubro,Comuna,Nombre,Teléfono,Puntuación Google,Número de Reseñas"

# Basic small CSV: 1 lavado, 1 mecanica general, 1 with invalid rubro
CSV_BASIC = (
    f"{CSV_HEADERS}\n"
    f"Lavado,Providencia,{TEST_PREFIX}Lavado Uno,+56911111111,4.7,50\n"
    f"Mecánica general,Las Condes,{TEST_PREFIX}Mec Uno,+56922222222,4.5,30\n"
    f"Peluquería,Ñuñoa,{TEST_PREFIX}InvalidRubro,+56933333333,4.0,10\n"
)

# CSV missing Nombre → invalid
CSV_MISSING_NAME = (
    f"{CSV_HEADERS}\n"
    f"Lavado,Providencia,,+56911111111,4.7,50\n"
)

# Multi-rubro CSV
CSV_MULTI = (
    f"{CSV_HEADERS}\n"
    f"Mecánica general / Frenos,Maipú,{TEST_PREFIX}MultiRubro,+56944444444,4.8,20\n"
)


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": ADMIN_EMAIL, "password": ADMIN_PASS},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module", autouse=True)
def cleanup(admin_token):
    """Cleanup all TESTCSV_ workshops before and after the module runs."""
    def _wipe():
        headers = {"Authorization": f"Bearer {admin_token}"}
        r = requests.get(f"{BASE_URL}/api/workshops?limit=5000", timeout=30)
        if r.status_code == 200:
            for w in r.json():
                if w.get("name", "").startswith(TEST_PREFIX):
                    requests.delete(
                        f"{BASE_URL}/api/workshops/{w['id']}",
                        headers=headers,
                        timeout=30,
                    )
    _wipe()
    yield
    _wipe()


# ----- Auth -----
def test_import_without_token_returns_401():
    r = requests.post(
        f"{BASE_URL}/api/workshops/import",
        json={"csv_text": CSV_BASIC, "dry_run": True},
        timeout=30,
    )
    assert r.status_code == 401, f"expected 401, got {r.status_code}"


# ----- Dry run preview -----
def test_dry_run_preview_counts(auth_headers):
    r = requests.post(
        f"{BASE_URL}/api/workshops/import",
        headers=auth_headers,
        json={"csv_text": CSV_BASIC, "dry_run": True},
        timeout=60,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["dry_run"] is True
    assert data["to_insert"] == 2, data
    assert data["unmapped"] == 1, data
    assert data["inserted"] == 0, data
    assert data["invalid"] == 0, data
    assert len(data["sample"]) == 2, data
    names = {s["name"] for s in data["sample"]}
    assert f"{TEST_PREFIX}Lavado Uno" in names
    assert f"{TEST_PREFIX}Mec Uno" in names
    # Sample lists category NAMES (not keys)
    cats_flat = [c for s in data["sample"] for c in s["categories"]]
    assert "Lavado de Vehículos" in cats_flat, cats_flat
    assert "Mecánica General" in cats_flat, cats_flat


# ----- Commit inserts and retrievable via filter -----
def test_commit_inserts_and_retrievable(auth_headers):
    r = requests.post(
        f"{BASE_URL}/api/workshops/import",
        headers=auth_headers,
        json={"csv_text": CSV_BASIC, "dry_run": False},
        timeout=60,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["dry_run"] is False
    assert data["inserted"] == 2, data
    assert data["to_insert"] == 2
    assert data["unmapped"] == 1

    # Retrievable via category filters
    r1 = requests.get(f"{BASE_URL}/api/workshops?category=lavado&limit=5000", timeout=30)
    assert r1.status_code == 200
    lav_names = {w["name"] for w in r1.json()}
    assert f"{TEST_PREFIX}Lavado Uno" in lav_names

    r2 = requests.get(f"{BASE_URL}/api/workshops?category=mecanica-general&limit=5000", timeout=30)
    assert r2.status_code == 200
    mec_names = {w["name"] for w in r2.json()}
    assert f"{TEST_PREFIX}Mec Uno" in mec_names


# ----- Rerun same CSV → all duplicates -----
def test_dedupe_on_rerun(auth_headers):
    r = requests.post(
        f"{BASE_URL}/api/workshops/import",
        headers=auth_headers,
        json={"csv_text": CSV_BASIC, "dry_run": False},
        timeout=60,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["duplicates"] == 2, data
    assert data["inserted"] == 0, data
    assert data["to_insert"] == 0, data


# ----- Missing name → invalid -----
def test_missing_name_counts_invalid(auth_headers):
    r = requests.post(
        f"{BASE_URL}/api/workshops/import",
        headers=auth_headers,
        json={"csv_text": CSV_MISSING_NAME, "dry_run": True},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["invalid"] == 1, data
    assert data["to_insert"] == 0, data
    assert data["inserted"] == 0, data


# ----- Multi-rubro splitting -----
def test_multi_rubro_maps_to_multiple_categories(auth_headers):
    r = requests.post(
        f"{BASE_URL}/api/workshops/import",
        headers=auth_headers,
        json={"csv_text": CSV_MULTI, "dry_run": False},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["inserted"] == 1, data

    r2 = requests.get(f"{BASE_URL}/api/workshops?limit=5000", timeout=30)
    match = next((w for w in r2.json() if w["name"] == f"{TEST_PREFIX}MultiRubro"), None)
    assert match is not None
    assert match["categories"] == ["mecanica-general", "frenos"], match["categories"]
    # Appears in filter for both
    r_frenos = requests.get(f"{BASE_URL}/api/workshops?category=frenos&limit=5000", timeout=30)
    assert any(w["name"] == f"{TEST_PREFIX}MultiRubro" for w in r_frenos.json())
    r_mec = requests.get(f"{BASE_URL}/api/workshops?category=mecanica-general&limit=5000", timeout=30)
    assert any(w["name"] == f"{TEST_PREFIX}MultiRubro" for w in r_mec.json())
