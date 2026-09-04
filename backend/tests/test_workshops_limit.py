"""Tests for the raised limit on GET /api/workshops (bug: 100 cap)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://taller-finder.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- GET /api/workshops: default limit now returns >100 ---
class TestWorkshopsLimit:
    def test_default_returns_more_than_100(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/workshops")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 100, f"Expected >100 workshops, got {len(data)}"

    def test_limit_5000_returns_all(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/workshops", params={"limit": 5000})
        assert r.status_code == 200
        data = r.json()
        # DB is described as ~389 workshops; assert at least 300
        assert len(data) >= 300, f"Expected ~389, got {len(data)}"
        # Sanity: each item has id/name
        first = data[0]
        assert "id" in first and "name" in first

    def test_category_personalizacion_full_count(self, api_client):
        r = api_client.get(
            f"{BASE_URL}/api/workshops",
            params={"category": "personalizacion", "limit": 5000},
        )
        assert r.status_code == 200
        items = r.json()
        # Compare to categories/counts
        r2 = api_client.get(f"{BASE_URL}/api/categories/counts")
        assert r2.status_code == 200
        counts = r2.json()
        expected = counts.get("personalizacion")
        assert expected is not None
        assert len(items) == expected, f"Filter returned {len(items)} but counts says {expected}"

    def test_limit_over_max_rejected(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/workshops", params={"limit": 100000})
        # Query(le=5000) => 422
        assert r.status_code == 422


# --- GET /api/categories/counts still accurate ---
class TestCategoryCounts:
    def test_counts_endpoint(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/categories/counts")
        assert r.status_code == 200
        counts = r.json()
        assert isinstance(counts, dict)
        assert "personalizacion" in counts
        assert counts["personalizacion"] > 0
        # Total across categories >= total workshops (categories can overlap)
        r2 = api_client.get(f"{BASE_URL}/api/workshops", params={"limit": 5000})
        total = len(r2.json())
        assert sum(counts.values()) >= total

    def test_all_category_filters_match_counts(self, api_client):
        counts = api_client.get(f"{BASE_URL}/api/categories/counts").json()
        # Spot check a few categories to make sure filter matches count
        for key, expected in counts.items():
            r = api_client.get(
                f"{BASE_URL}/api/workshops",
                params={"category": key, "limit": 5000},
            )
            assert r.status_code == 200
            got = len(r.json())
            assert got == expected, f"Category {key}: filter={got} vs counts={expected}"


# --- Regressions: featured/comunas still work ---
class TestRegressions:
    def test_featured_still_works(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/workshops/featured")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_comunas_still_works(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/comunas")
        assert r.status_code == 200
        comunas = r.json()
        assert isinstance(comunas, list)
        assert len(comunas) > 0

    def test_search_within_full_set(self, api_client):
        # Search + limit should still work
        r = api_client.get(
            f"{BASE_URL}/api/workshops",
            params={"search": "taller", "limit": 5000},
        )
        assert r.status_code == 200
        assert isinstance(r.json(), list)
