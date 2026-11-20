"""Integration tests for Pagani AI Atelier backend API."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.repository import CONFIGURATIONS


@pytest.fixture(autouse=True)
def clear_store():
    """Clear in-memory store between tests."""
    CONFIGURATIONS.clear()
    yield
    CONFIGURATIONS.clear()


client = TestClient(app)


# ── Health ────────────────────────────────────────────────────────────

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["service"] == "pagani-ai-atelier"


# ── Vehicle listing ──────────────────────────────────────────────────

def test_list_vehicles():
    r = client.get("/api/v1/vehicles")
    assert r.status_code == 200
    vehicles = r.json()
    assert any(v["id"] == "pagani_utopia" for v in vehicles)


def test_vehicle_options():
    r = client.get("/api/v1/vehicles/pagani_utopia/options")
    assert r.status_code == 200
    body = r.json()
    assert body["vehicle_id"] == "pagani_utopia"
    opts = body["options"]
    assert "exterior.body_color" in opts
    assert "emerald_green" in opts["exterior.body_color"]


def test_vehicle_options_unknown():
    r = client.get("/api/v1/vehicles/unknown_car/options")
    assert r.status_code == 404


# ── Themes ───────────────────────────────────────────────────────────

def test_themes():
    r = client.get("/api/v1/themes", params={"vehicle_id": "pagani_utopia"})
    assert r.status_code == 200
    body = r.json()
    assert body["vehicle_id"] == "pagani_utopia"
    assert len(body["exterior"]) >= 1
    assert len(body["interior"]) >= 1
    ext_ids = [t["id"] for t in body["exterior"]]
    assert "emerald_heritage" in ext_ids


def test_themes_unknown_vehicle():
    r = client.get("/api/v1/themes", params={"vehicle_id": "unknown"})
    assert r.status_code == 404


# ── AI consult (mock) ────────────────────────────────────────────────

def test_consult_with_themes():
    r = client.post("/api/v1/ai/consult", json={
        "vehicle_id": "pagani_utopia",
        "exterior_theme_id": "emerald_heritage",
        "interior_theme_id": "italian_heritage",
        "custom_prompt": "emerald green with gold stitching",
        "personality": "elegant"
    })
    assert r.status_code == 200
    body = r.json()
    assert body["vehicle_id"] == "pagani_utopia"
    config = body["interpreted_configuration"]
    assert config["exterior"]["body_color"] == "emerald_green"
    assert config["interior"]["seat_material"] == "leather"
    assert config["interior"]["stitching"] == "gold"
    assert body["requires_customer_review"] is True


def test_consult_custom_prompt_only():
    r = client.post("/api/v1/ai/consult", json={
        "vehicle_id": "pagani_utopia",
        "custom_prompt": "midnight blue with silver wheels and black interior"
    })
    assert r.status_code == 200
    config = r.json()["interpreted_configuration"]
    assert config["exterior"]["body_color"] == "midnight_blue"
    assert config["wheels"]["finish"] == "polished_silver"
    assert config["interior"]["seat_color"] == "black"


def test_consult_unknown_vehicle():
    r = client.post("/api/v1/ai/consult", json={
        "vehicle_id": "ferrari_sf90",
        "custom_prompt": "red"
    })
    assert r.status_code == 422


def test_consult_empty_prompt():
    r = client.post("/api/v1/ai/consult", json={
        "vehicle_id": "pagani_utopia",
        "custom_prompt": ""
    })
    assert r.status_code == 200
    assert r.json()["interpreted_configuration"]["vehicle_id"] == "pagani_utopia"


# ── AI generate (3 proposals) ────────────────────────────────────────

def test_generate_three_proposals():
    r = client.post("/api/v1/ai/generate", json={
        "brief": {
            "vehicle_id": "pagani_utopia",
            "exterior_theme_id": "emerald_heritage",
            "interior_theme_id": "italian_heritage",
            "custom_prompt": "emerald green with champagne gold"
        },
        "count": 3
    })
    assert r.status_code == 200
    body = r.json()
    assert body["vehicle_id"] == "pagani_utopia"
    proposals = body["proposals"]
    assert len(proposals) == 3
    # Each proposal has a unique ID and name
    ids = {p["id"] for p in proposals}
    assert len(ids) == 3
    names = [p["proposal_name"] for p in proposals]
    assert "Original interpretation" in names
    assert "Polished interpretation" in names
    assert "Dark-detail interpretation" in names


def test_generate_proposals_have_variation():
    r = client.post("/api/v1/ai/generate", json={
        "brief": {
            "vehicle_id": "pagani_utopia",
            "exterior_theme_id": "emerald_heritage",
            "custom_prompt": "emerald green"
        },
        "count": 3
    })
    proposals = r.json()["proposals"]
    finishes = [p["wheels"]["finish"] for p in proposals]
    # Proposals should have different wheel finishes
    assert len(set(finishes)) > 1, f"All proposals had same finish: {finishes}"


def test_generate_proposals_are_retrievable():
    r = client.post("/api/v1/ai/generate", json={
        "brief": {"vehicle_id": "pagani_utopia", "custom_prompt": "black"},
        "count": 3
    })
    proposals = r.json()["proposals"]
    for p in proposals:
        get = client.get(f"/api/v1/configurations/{p['id']}")
        assert get.status_code == 200
        assert get.json()["id"] == p["id"]


def test_generate_no_validation_warnings_on_catalogue_values():
    r = client.post("/api/v1/ai/generate", json={
        "brief": {
            "vehicle_id": "pagani_utopia",
            "exterior_theme_id": "stealth_obsidian",
            "interior_theme_id": "dark_atelier",
            "custom_prompt": ""
        },
        "count": 3
    })
    for p in r.json()["proposals"]:
        assert p["validation_warnings"] == [], f"Warnings: {p['validation_warnings']}"


# ── Configuration CRUD ───────────────────────────────────────────────

def _create_config():
    r = client.post("/api/v1/ai/generate", json={
        "brief": {
            "vehicle_id": "pagani_utopia",
            "exterior_theme_id": "stealth_obsidian",
            "interior_theme_id": "dark_atelier",
            "custom_prompt": "obsidian black"
        },
        "count": 1
    })
    return r.json()["proposals"][0]


def test_get_configuration():
    cfg = _create_config()
    r = client.get(f"/api/v1/configurations/{cfg['id']}")
    assert r.status_code == 200
    assert r.json()["vehicle_id"] == "pagani_utopia"


def test_get_configuration_not_found():
    r = client.get("/api/v1/configurations/does-not-exist")
    assert r.status_code == 404


def test_patch_valid_change():
    cfg = _create_config()
    r = client.patch(f"/api/v1/configurations/{cfg['id']}", json={
        "changes": {"interior.seat_color": "cognac"}
    })
    assert r.status_code == 200
    body = r.json()
    assert body["configuration"]["interior"]["seat_color"] == "cognac"
    # Other values preserved
    assert body["configuration"]["exterior"]["body_color"] == "obsidian_black"


def test_patch_preserves_on_rejection():
    cfg = _create_config()
    original_color = cfg["exterior"]["body_color"]
    r = client.patch(f"/api/v1/configurations/{cfg['id']}", json={
        "changes": {"exterior.body_color": "neon_pink"}
    })
    assert r.status_code == 200
    body = r.json()
    # Warning generated
    assert any("neon_pink" in w for w in body["warnings"])
    # Original color preserved
    assert body["configuration"]["exterior"]["body_color"] == original_color


def test_patch_invalid_path_rejected():
    cfg = _create_config()
    r = client.patch(f"/api/v1/configurations/{cfg['id']}", json={
        "changes": {"engine.turbo": "twin"}
    })
    assert r.status_code == 422
    assert "Invalid customization path" in r.json()["detail"]


def test_patch_multiple_changes():
    cfg = _create_config()
    r = client.patch(f"/api/v1/configurations/{cfg['id']}", json={
        "changes": {
            "interior.seat_color": "ivory",
            "interior.stitching": "cream",
            "wheels.finish": "champagne_gold"
        }
    })
    assert r.status_code == 200
    c = r.json()["configuration"]
    assert c["interior"]["seat_color"] == "ivory"
    assert c["interior"]["stitching"] == "cream"
    assert c["wheels"]["finish"] == "champagne_gold"
    # Exterior unchanged
    assert c["exterior"]["body_color"] == "obsidian_black"


def test_patch_not_found():
    r = client.patch("/api/v1/configurations/nonexistent", json={
        "changes": {"interior.seat_color": "tan"}
    })
    assert r.status_code == 404


# ── Validation and catalogue constraints ─────────────────────────────

def test_unsupported_options_stripped_with_warnings():
    """The AI should never invent options outside the catalogue."""
    r = client.post("/api/v1/ai/consult", json={
        "vehicle_id": "pagani_utopia",
        "custom_prompt": "carbon fiber body with titanium exhaust",
        "personality": "sporty"
    })
    assert r.status_code == 200
    config = r.json()["interpreted_configuration"]
    # No invented options in the returned config
    for group in ("exterior", "wheels", "interior", "bespoke"):
        for key, value in config.get(group, {}).items():
            # Every value present must be in the catalogue
            path = f"{group}.{key}"
            from app.catalogue import VEHICLES
            allowed = VEHICLES["pagani_utopia"]["options"].get(path)
            assert allowed is not None, f"Invented key {path}"
            assert value in allowed, f"Invented value {value} for {path}"


def test_all_themes_pass_validation():
    """Every predefined theme should pass validation without warnings."""
    from app.catalogue import EXTERIOR_THEMES, INTERIOR_THEMES
    for theme in EXTERIOR_THEMES:
        r = client.post("/api/v1/ai/consult", json={
            "vehicle_id": "pagani_utopia",
            "exterior_theme_id": theme["id"],
            "custom_prompt": ""
        })
        assert r.status_code == 200
        warnings = r.json()["warnings"]
        assert warnings == [], f"Theme {theme['id']} produced warnings: {warnings}"

    for theme in INTERIOR_THEMES:
        r = client.post("/api/v1/ai/consult", json={
            "vehicle_id": "pagani_utopia",
            "interior_theme_id": theme["id"],
            "custom_prompt": ""
        })
        assert r.status_code == 200
        warnings = r.json()["warnings"]
        assert warnings == [], f"Theme {theme['id']} produced warnings: {warnings}"

