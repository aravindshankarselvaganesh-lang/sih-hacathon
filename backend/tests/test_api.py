"""
API smoke tests (no brittle DB dependency).
------------------------------------------
Covers:
- GET / (root health)
- GET /healthz (container HEALTHCHECK target)
- GET /api/v1/reports/dgms-oisd/pdf with an empty roster (mocked DB)

DB access is mocked via FastAPI dependency_overrides so these tests run
in CI without PostgreSQL/SQLite files or native (zbar/OpenCV) deps.
Live-DB tests should be marked with @pytest.mark.skip unless a DB is available.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest

fastapi_testclient = pytest.importorskip("fastapi.testclient")
TestClient = fastapi_testclient.TestClient

from app.main import app
from app.core.database import get_db


class _FakeScalars:
    def all(self):
        return []


class _FakeResult:
    def scalars(self):
        return _FakeScalars()


class _FakeSession:
    async def execute(self, *args, **kwargs):
        return _FakeResult()


async def _mock_empty_db():
    yield _FakeSession()


@pytest.fixture()
def client():
    # Override DB dependency: reports endpoint sees an empty roster.
    app.dependency_overrides[get_db] = _mock_empty_db
    # NOTE: plain TestClient(app) (no `with` block) so the app lifespan
    # (init_db) is NOT executed — keeps tests hermetic / non-brittle.
    c = TestClient(app, raise_server_exceptions=False)
    yield c
    app.dependency_overrides.clear()


def test_root_health(client):
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ONLINE"
    assert "version" in body


def test_healthz(client):
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_reports_empty_roster_returns_pdf(client):
    r = client.get("/api/v1/reports/dgms-oisd/pdf")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("application/pdf")
    assert r.content.startswith(b"%PDF")


@pytest.mark.skip(reason="Requires live DB with seeded roster; run manually with DATABASE_URL set.")
def test_reports_live_db_roster():
    # Example placeholder for an integration test against a real database.
    # Un-skipped only in environments with a seeded DB.
    pass
