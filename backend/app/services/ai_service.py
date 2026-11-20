import asyncio
import json
import logging
import re
from typing import Any
import httpx
from groq import (
    APIConnectionError,
    APIError,
    APITimeoutError,
    AsyncGroq,
    AuthenticationError,
    BadRequestError,
    NotFoundError,
    RateLimitError,
)

from app.config import settings
from app.catalogue import EXTERIOR_THEMES, INTERIOR_THEMES, VEHICLES
from app.services.compatibility import apply_flat_values, validate_configuration

logger = logging.getLogger("pagani.ai_service")

SYSTEM_PROMPT = """You are a luxury automotive design brief interpreter for Pagani Automobili. You must only configure the vehicle ID supplied.
Return JSON only, with keys: design_personality, exterior, wheels, interior, bespoke.
Only use options strictly present in the supplied catalogue. Never invent mechanical, structural, aerodynamic,
safety, or body-shape modifications. If a requested option is unsupported, omit it.
The result is a design proposal, not a factory-approved build specification.
Ensure the output is strictly valid JSON without Markdown code fences, commentary, or extra text."""


def _theme_values(theme_id: str | None, themes: list[dict]) -> dict:
    if not theme_id:
        return {}
    for theme in themes:
        if theme["id"] == theme_id:
            return theme["values"]
    return {}


def _mock_parse(prompt: str, personality: str | None) -> dict:
    p = prompt.lower()
    out = {"design_personality": personality or "bespoke"}
    ext: dict[str, str] = {}
    wheels: dict[str, str] = {}
    interior: dict[str, str] = {}

    color_map = {
        "green": "emerald_green",
        "emerald": "emerald_green",
        "blue": "midnight_blue",
        "black": "obsidian_black",
        "white": "pearl_white",
        "burgundy": "burgundy",
        "red": "burgundy",
    }
    for word, value in color_map.items():
        if word in p:
            ext["body_color"] = value
            break
    if "carbon" in p:
        ext["carbon_finish"] = "exposed_dark"
    if "gold" in p or "champagne" in p:
        wheels["finish"] = "champagne_gold"
    elif "silver" in p:
        wheels["finish"] = "polished_silver"
    elif "black wheel" in p:
        wheels["finish"] = "gloss_black"

    for word, value in [
        ("tan", "tan"),
        ("cognac", "cognac"),
        ("ivory", "ivory"),
        ("burgundy", "burgundy"),
        ("black", "black"),
    ]:
        if word in p and ("interior" in p or "leather" in p or "seat" in p):
            interior["seat_color"] = value
            interior["seat_material"] = "leather"
            break
    if "alcantara" in p:
        interior["seat_material"] = "alcantara"
    if "stitch" in p and "gold" in p:
        interior["stitching"] = "gold"

    return {
        "design_personality": out["design_personality"],
        "exterior": ext,
        "wheels": wheels,
        "interior": interior,
        "bespoke": {},
    }


def _extract_json(raw: str) -> dict[str, Any]:
    """Clean markdown code blocks and parse raw JSON text."""
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        text = text[start : end + 1]
    return json.loads(text)


async def _groq_parse_with_status(payload: dict) -> tuple[dict, bool]:
    """Send brief to GroqCloud API with robust error handling, retries, and fallback.
    
    Returns:
        tuple[dict, bool]: (parsed_data, is_mock_fallback)
    """
    custom_prompt = payload.get("custom_prompt", "")
    personality = payload.get("personality")

    if not settings.groq_api_key or not settings.groq_api_key.strip():
        logger.info("GROQ_API_KEY is not configured. Transparently falling back to mock AI parser.")
        return _mock_parse(custom_prompt, personality), True

    vehicle = VEHICLES.get(payload["vehicle_id"], {})
    user_message = json.dumps(
        {
            "vehicle_id": payload["vehicle_id"],
            "catalogue": vehicle.get("options", {}),
            "customer_brief": payload,
        },
        indent=2,
    )

    client = AsyncGroq(
        api_key=settings.groq_api_key,
        timeout=settings.groq_timeout_seconds,
        max_retries=settings.groq_max_retries,
    )

    max_attempts = settings.groq_max_retries
    for attempt in range(1, max_attempts + 1):
        try:
            # First attempt with json_object format, fallback to standard if unsupported
            try:
                response = await client.chat.completions.create(
                    model=settings.groq_model,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_message},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3,
                )
            except BadRequestError as exc:
                # If model does not support response_format={"type": "json_object"}
                if "response_format" in str(exc).lower():
                    logger.info("Groq model %s does not support json_object mode; retrying without format constraint.", settings.groq_model)
                    response = await client.chat.completions.create(
                        model=settings.groq_model,
                        messages=[
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": user_message},
                        ],
                        temperature=0.3,
                    )
                else:
                    raise

            choice = response.choices[0]
            raw_content = choice.message.content or "{}"
            parsed = _extract_json(raw_content)
            if not isinstance(parsed, dict):
                raise ValueError("Groq response was not a JSON dictionary.")

            # Ensure expected top-level keys
            parsed.setdefault("design_personality", personality or "bespoke")
            for group in ("exterior", "wheels", "interior", "bespoke"):
                if not isinstance(parsed.get(group), dict):
                    parsed[group] = {}

            return parsed, False

        except RateLimitError as exc:
            logger.warning("Groq rate limit (429) on attempt %d/%d: %s", attempt, max_attempts, exc)
            if attempt < max_attempts:
                await asyncio.sleep(2**attempt)
                continue
            logger.error("Groq rate limit retries exhausted. Transparently falling back to mock engine.")
            return _mock_parse(custom_prompt, personality), True

        except AuthenticationError as exc:
            logger.error("Groq authentication failed (invalid or missing API key). Falling back to mock engine: %s", exc)
            return _mock_parse(custom_prompt, personality), True

        except NotFoundError as exc:
            logger.error("Groq model %s not found or unavailable. Falling back to mock engine: %s", settings.groq_model, exc)
            return _mock_parse(custom_prompt, personality), True

        except APITimeoutError as exc:
            logger.warning("Groq request timed out on attempt %d/%d: %s", attempt, max_attempts, exc)
            if attempt < max_attempts:
                await asyncio.sleep(1)
                continue
            logger.error("Groq request timeout exhausted. Falling back to mock engine.")
            return _mock_parse(custom_prompt, personality), True

        except APIConnectionError as exc:
            logger.warning("Groq connection error on attempt %d/%d: %s", attempt, max_attempts, exc)
            if attempt < max_attempts:
                await asyncio.sleep(1)
                continue
            logger.error("Groq connection retries exhausted. Falling back to mock engine.")
            return _mock_parse(custom_prompt, personality), True

        except (json.JSONDecodeError, ValueError) as exc:
            logger.error("Failed to parse JSON from Groq response: %s. Falling back to mock engine.", exc)
            return _mock_parse(custom_prompt, personality), True

        except APIError as exc:
            logger.error("Groq API error (%s): %s. Falling back to mock engine.", type(exc).__name__, exc)
            return _mock_parse(custom_prompt, personality), True

        except Exception as exc:
            logger.error("Unexpected error during Groq inference: %s. Falling back to mock engine.", exc)
            return _mock_parse(custom_prompt, personality), True

    return _mock_parse(custom_prompt, personality), True


async def _groq_parse(payload: dict) -> dict:
    """Convenience wrapper returning parsed data dictionary."""
    parsed, _ = await _groq_parse_with_status(payload)
    return parsed


async def _ollama_parse(payload: dict) -> dict:
    """Legacy Ollama inference fallback."""
    vehicle = VEHICLES[payload["vehicle_id"]]
    prompt = {
        "vehicle_id": payload["vehicle_id"],
        "catalogue": vehicle["options"],
        "customer_brief": payload,
    }
    async with httpx.AsyncClient(timeout=90) as client:
        response = await client.post(
            f"{settings.ollama_base_url.rstrip('/')}/api/generate",
            json={
                "model": settings.ollama_model,
                "system": SYSTEM_PROMPT,
                "prompt": json.dumps(prompt),
                "stream": False,
                "format": "json",
            },
        )
        response.raise_for_status()
        result = response.json()
    return json.loads(result["response"])


async def interpret_brief(brief: dict) -> dict:
    vehicle_id = brief["vehicle_id"]
    if vehicle_id not in VEHICLES:
        raise ValueError("This vehicle is not configured in the demo catalogue.")

    flat: dict[str, Any] = {}
    flat.update(_theme_values(brief.get("exterior_theme_id"), EXTERIOR_THEMES))
    flat.update(_theme_values(brief.get("interior_theme_id"), INTERIOR_THEMES))

    prompt_payload = {**brief, "catalogue": VEHICLES[vehicle_id]["options"]}

    provider = settings.ai_provider.lower()
    actual_source = "mock"
    actual_provider = "mock"

    if provider == "groq":
        parsed, used_fallback = await _groq_parse_with_status(prompt_payload)
        if used_fallback:
            actual_source = "mock_fallback"
            actual_provider = "mock_fallback"
        else:
            actual_source = "ai_groq"
            actual_provider = "groq"
    elif provider == "ollama":
        try:
            parsed = await _ollama_parse(prompt_payload)
            actual_source = "ai_ollama"
            actual_provider = "ollama"
        except Exception as exc:
            logger.warning("Ollama call failed: %s. Falling back to mock.", exc)
            parsed = _mock_parse(brief.get("custom_prompt", ""), brief.get("personality"))
            actual_source = "mock_fallback"
            actual_provider = "mock_fallback"
    else:
        parsed = _mock_parse(brief.get("custom_prompt", ""), brief.get("personality"))
        actual_source = "mock"
        actual_provider = "mock"

    for group in ("exterior", "wheels", "interior", "bespoke"):
        flat.update({f"{group}.{k}": v for k, v in parsed.get(group, {}).items()})

    config = {
        "vehicle_id": vehicle_id,
        "exterior": {},
        "wheels": {},
        "interior": {},
        "bespoke": {},
        "design_personality": parsed.get("design_personality"),
        "source": actual_source,
        "ai_provider": actual_provider,
    }
    apply_flat_values(config, flat)
    config, warnings = validate_configuration(config)
    return config
