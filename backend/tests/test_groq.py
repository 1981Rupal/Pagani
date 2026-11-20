"""GroqCloud AI inference unit & integration tests."""
import json
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from groq import (
    APIConnectionError,
    APITimeoutError,
    AuthenticationError,
    BadRequestError,
    NotFoundError,
    RateLimitError,
)

from app.config import settings
from app.main import app
from app.repository import CONFIGURATIONS, LOCAL_PROPOSALS, LOCAL_VERSIONS
from app.services.ai_service import _extract_json, _groq_parse, interpret_brief


@pytest.fixture(autouse=True)
def clear_stores():
    CONFIGURATIONS.clear()
    LOCAL_VERSIONS.clear()
    LOCAL_PROPOSALS.clear()
    yield
    CONFIGURATIONS.clear()
    LOCAL_VERSIONS.clear()
    LOCAL_PROPOSALS.clear()


client = TestClient(app)


def _mock_groq_response(content_str: str):
    """Helper to create a fake Groq chat completion response."""
    choice = MagicMock()
    choice.message.content = content_str
    response = MagicMock()
    response.choices = [choice]
    return response


# ── JSON Extraction Helper ──────────────────────────────────────────


def test_extract_json_plain():
    raw = '{"design_personality": "racing", "exterior": {"body_color": "emerald_green"}}'
    data = _extract_json(raw)
    assert data["design_personality"] == "racing"
    assert data["exterior"]["body_color"] == "emerald_green"


def test_extract_json_markdown_fences():
    raw = """```json
    {
      "design_personality": "pure_elegance",
      "exterior": {"body_color": "pearl_white"}
    }
    ```"""
    data = _extract_json(raw)
    assert data["design_personality"] == "pure_elegance"
    assert data["exterior"]["body_color"] == "pearl_white"


def test_extract_json_with_surrounding_text():
    raw = """Here is your bespoke Pagani configuration:
    {
      "design_personality": "track",
      "exterior": {"body_color": "obsidian_black"}
    }
    Enjoy your drive!"""
    data = _extract_json(raw)
    assert data["exterior"]["body_color"] == "obsidian_black"


# ── Groq Parse with Mocked AsyncGroq Client ──────────────────────────


@pytest.mark.anyio
async def test_groq_parse_valid_structured_json():
    fake_completion = {
        "design_personality": "grand_touring",
        "exterior": {"body_color": "midnight_blue", "carbon_finish": "satin_dark"},
        "wheels": {"design": "approved_wheel_01", "finish": "champagne_gold"},
        "interior": {
            "seat_material": "leather",
            "seat_color": "cognac",
            "stitching": "gold",
        },
        "bespoke": {"embroidery": "customer_initials"},
    }

    mock_client = AsyncMock()
    mock_client.chat.completions.create.return_value = _mock_groq_response(
        json.dumps(fake_completion)
    )

    with patch("app.services.ai_service.AsyncGroq", return_value=mock_client), patch.object(
        settings, "groq_api_key", "gsk_test_mock_key"
    ):
        result = await _groq_parse(
            {
                "vehicle_id": "pagani_utopia",
                "custom_prompt": "midnight blue with cognac leather",
                "personality": "grand_touring",
            }
        )

    assert result["design_personality"] == "grand_touring"
    assert result["exterior"]["body_color"] == "midnight_blue"
    assert result["wheels"]["finish"] == "champagne_gold"
    assert result["interior"]["seat_color"] == "cognac"


@pytest.mark.anyio
async def test_groq_parse_unconfigured_api_key_fallback():
    with patch.object(settings, "groq_api_key", ""):
        result = await _groq_parse(
            {
                "vehicle_id": "pagani_utopia",
                "custom_prompt": "emerald green with gold wheels",
                "personality": "artistic",
            }
        )
    # Falls back to mock engine cleanly
    assert result["exterior"]["body_color"] == "emerald_green"
    assert result["wheels"]["finish"] == "champagne_gold"
    assert result["design_personality"] == "artistic"


@pytest.mark.anyio
async def test_groq_parse_malformed_json_fallback():
    mock_client = AsyncMock()
    mock_client.chat.completions.create.return_value = _mock_groq_response(
        "INVALID NOT JSON AT ALL"
    )

    with patch("app.services.ai_service.AsyncGroq", return_value=mock_client), patch.object(
        settings, "groq_api_key", "gsk_test_key"
    ):
        result = await _groq_parse(
            {
                "vehicle_id": "pagani_utopia",
                "custom_prompt": "midnight blue",
            }
        )
    # Should not crash; gracefully fall back to mock
    assert result["exterior"]["body_color"] == "midnight_blue"


@pytest.mark.anyio
async def test_groq_parse_authentication_error_fallback():
    mock_client = AsyncMock()
    # Simulate 401 AuthenticationError
    req = MagicMock()
    mock_client.chat.completions.create.side_effect = AuthenticationError(
        "Invalid API Key", response=MagicMock(status_code=401), body={"error": "unauthorized"}
    )

    with patch("app.services.ai_service.AsyncGroq", return_value=mock_client), patch.object(
        settings, "groq_api_key", "gsk_invalid_key"
    ):
        result = await _groq_parse(
            {
                "vehicle_id": "pagani_utopia",
                "custom_prompt": "pearl white with silver wheels",
            }
        )
    assert result["exterior"]["body_color"] == "pearl_white"
    assert result["wheels"]["finish"] == "polished_silver"


@pytest.mark.anyio
async def test_groq_parse_rate_limit_error_fallback():
    mock_client = AsyncMock()
    mock_client.chat.completions.create.side_effect = RateLimitError(
        "Rate limit reached (429)", response=MagicMock(status_code=429), body={"error": "rate_limit"}
    )

    with patch("app.services.ai_service.AsyncGroq", return_value=mock_client), patch.object(
        settings, "groq_api_key", "gsk_test_key"
    ), patch("asyncio.sleep", new_callable=AsyncMock):
        result = await _groq_parse(
            {
                "vehicle_id": "pagani_utopia",
                "custom_prompt": "burgundy leather",
            }
        )
    assert result["interior"]["seat_color"] == "burgundy"


@pytest.mark.anyio
async def test_groq_parse_timeout_error_fallback():
    mock_client = AsyncMock()
    mock_client.chat.completions.create.side_effect = APITimeoutError(
        request=MagicMock()
    )

    with patch("app.services.ai_service.AsyncGroq", return_value=mock_client), patch.object(
        settings, "groq_api_key", "gsk_test_key"
    ), patch("asyncio.sleep", new_callable=AsyncMock):
        result = await _groq_parse(
            {
                "vehicle_id": "pagani_utopia",
                "custom_prompt": "obsidian black",
            }
        )
    assert result["exterior"]["body_color"] == "obsidian_black"


@pytest.mark.anyio
async def test_groq_parse_model_not_found_fallback():
    mock_client = AsyncMock()
    mock_client.chat.completions.create.side_effect = NotFoundError(
        "Model not found", response=MagicMock(status_code=404), body={"error": "model_not_found"}
    )

    with patch("app.services.ai_service.AsyncGroq", return_value=mock_client), patch.object(
        settings, "groq_api_key", "gsk_test_key"
    ):
        result = await _groq_parse(
            {
                "vehicle_id": "pagani_utopia",
                "custom_prompt": "midnight blue",
            }
        )
    assert result["exterior"]["body_color"] == "midnight_blue"


# ── Catalogue Sanitization & Warnings with Groq Output ───────────────


@pytest.mark.anyio
async def test_groq_catalogue_validation_strips_unsupported_options():
    fake_completion = {
        "design_personality": "experimental",
        "exterior": {
            "body_color": "neon_pink_unsupported",  # Not in catalogue
            "carbon_finish": "exposed_dark",       # In catalogue
            "rear_wing_spoiler": "giant_carbon_wing"  # Invalid component path
        },
        "wheels": {
            "finish": "gloss_black"
        },
        "interior": {
            "seat_color": "electric_purple"  # Not in catalogue
        },
        "bespoke": {}
    }

    mock_client = AsyncMock()
    mock_client.chat.completions.create.return_value = _mock_groq_response(
        json.dumps(fake_completion)
    )

    with patch("app.services.ai_service.AsyncGroq", return_value=mock_client), patch.object(
        settings, "groq_api_key", "gsk_test_key"
    ):
        config = await interpret_brief({
            "vehicle_id": "pagani_utopia",
            "custom_prompt": "neon pink and electric purple",
        })

    # Unsupported values must be stripped
    assert "body_color" not in config["exterior"]
    assert "rear_wing_spoiler" not in config["exterior"]
    assert "seat_color" not in config["interior"]

    # Valid values must be preserved
    assert config["exterior"]["carbon_finish"] == "exposed_dark"
    assert config["wheels"]["finish"] == "gloss_black"

    # Validation warnings must clearly document what was stripped
    warnings = config["validation_warnings"]
    assert len(warnings) >= 3
    assert any("neon_pink_unsupported" in w for w in warnings)
    assert any("electric_purple" in w for w in warnings)
    assert any("rear_wing_spoiler" in w for w in warnings)


# ── Full API Endpoints with Groq Provider ────────────────────────────


def test_api_generate_with_groq_completion():
    fake_completion = {
        "design_personality": "art_in_motion",
        "exterior": {"body_color": "emerald_green", "carbon_finish": "gloss_dark"},
        "wheels": {"design": "approved_wheel_01", "finish": "champagne_gold"},
        "interior": {
            "seat_material": "leather",
            "seat_color": "tan",
            "stitching": "brown",
        },
        "bespoke": {"embroidery": "none"},
    }

    mock_client = AsyncMock()
    mock_client.chat.completions.create.return_value = _mock_groq_response(
        json.dumps(fake_completion)
    )

    with patch("app.services.ai_service.AsyncGroq", return_value=mock_client), patch.object(
        settings, "groq_api_key", "gsk_test_key"
    ):
        r = client.post(
            "/api/v1/ai/generate",
            json={
                "brief": {
                    "vehicle_id": "pagani_utopia",
                    "custom_prompt": "emerald green and tan interior",
                },
                "count": 3,
            },
        )

    assert r.status_code == 200
    data = r.json()
    proposals = data["proposals"]
    assert len(proposals) == 3

    # Check that all proposals maintain base valid configuration
    for p in proposals:
        assert p["exterior"]["body_color"] == "emerald_green"
        assert p["interior"]["seat_color"] == "tan"
        assert p["validation_warnings"] == []

    # Check distinct finishes across proposals
    finishes = [p["wheels"]["finish"] for p in proposals]
    assert len(set(finishes)) > 1
    assert "polished_silver" in finishes
    assert "dark_titanium" in finishes



def test_source_transparency_live_groq_vs_mock_fallback():
    # 1. When Groq responds successfully:
    fake_completion = {
        "design_personality": "bespoke",
        "exterior": {"body_color": "obsidian_black"},
        "wheels": {"finish": "gloss_black"},
        "interior": {},
        "bespoke": {},
    }
    mock_client = AsyncMock()
    mock_client.chat.completions.create.return_value = _mock_groq_response(
        json.dumps(fake_completion)
    )

    with patch("app.services.ai_service.AsyncGroq", return_value=mock_client), patch.object(
        settings, "groq_api_key", "gsk_test_key"
    ):
        r_live = client.post(
            "/api/v1/ai/consult",
            json={"vehicle_id": "pagani_utopia", "custom_prompt": "obsidian black"},
        )
        assert r_live.status_code == 200
        live_body = r_live.json()
        assert live_body["source"] == "ai_groq"
        assert live_body["ai_provider"] == "groq"
        assert live_body["interpreted_configuration"]["source"] == "ai_groq"

    # 2. When Groq API key is absent:
    with patch.object(settings, "groq_api_key", ""):
        r_mock = client.post(
            "/api/v1/ai/consult",
            json={"vehicle_id": "pagani_utopia", "custom_prompt": "obsidian black"},
        )
        assert r_mock.status_code == 200
        mock_body = r_mock.json()
        assert mock_body["source"] == "mock_fallback"
        assert mock_body["ai_provider"] == "mock_fallback"
        assert mock_body["interpreted_configuration"]["source"] == "mock_fallback"
