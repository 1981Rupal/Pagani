import json
import re
import httpx
from app.config import settings
from app.catalogue import EXTERIOR_THEMES, INTERIOR_THEMES, VEHICLES
from app.services.compatibility import apply_flat_values, validate_configuration

SYSTEM_PROMPT = '''
You are a luxury automotive design brief interpreter. You must only configure the vehicle ID supplied.
Return JSON only, with keys: design_personality, exterior, wheels, interior, bespoke.
Only use options in the supplied catalogue. Never invent mechanical, structural, aerodynamic,
safety, or body-shape modifications. If a requested option is unsupported, omit it.
The result is a design proposal, not a factory-approved build specification.
'''

def _theme_values(theme_id, themes):
    for theme in themes:
        if theme["id"] == theme_id:
            return theme["values"]
    return {}

def _mock_parse(prompt: str, personality: str | None):
    p = prompt.lower()
    out = {"design_personality": personality or "bespoke"}
    ext, wheels, interior = {}, {}, {}
    color_map = {
        "green":"emerald_green", "emerald":"emerald_green",
        "blue":"midnight_blue", "black":"obsidian_black",
        "white":"pearl_white", "burgundy":"burgundy", "red":"burgundy"
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
    for word, value in [("tan","tan"),("cognac","cognac"),("ivory","ivory"),("burgundy","burgundy"),("black","black")]:
        if word in p and ("interior" in p or "leather" in p or "seat" in p):
            interior["seat_color"] = value
            interior["seat_material"] = "leather"
            break
    if "alcantara" in p:
        interior["seat_material"] = "alcantara"
    if "stitch" in p and "gold" in p:
        interior["stitching"] = "gold"
    return {"design_personality": out["design_personality"], "exterior": ext, "wheels": wheels, "interior": interior, "bespoke": {}}

async def _ollama_parse(payload: dict) -> dict:
    vehicle = VEHICLES[payload["vehicle_id"]]
    prompt = {
        "vehicle_id": payload["vehicle_id"],
        "catalogue": vehicle["options"],
        "customer_brief": payload
    }
    async with httpx.AsyncClient(timeout=90) as client:
        response = await client.post(
            f"{settings.ollama_base_url.rstrip('/')}/api/generate",
            json={"model": settings.ollama_model,
                  "system": SYSTEM_PROMPT,
                  "prompt": json.dumps(prompt),
                  "stream": False,
                  "format": "json"}
        )
        response.raise_for_status()
        result = response.json()
    return json.loads(result["response"])

async def interpret_brief(brief: dict) -> dict:
    vehicle_id = brief["vehicle_id"]
    if vehicle_id not in VEHICLES:
        raise ValueError("This vehicle is not configured in the demo catalogue.")
    flat = {}
    flat.update(_theme_values(brief.get("exterior_theme_id"), EXTERIOR_THEMES))
    flat.update(_theme_values(brief.get("interior_theme_id"), INTERIOR_THEMES))
    prompt_payload = {**brief, "catalogue": VEHICLES[vehicle_id]["options"]}
    if settings.ai_provider.lower() == "ollama":
        try:
            parsed = await _ollama_parse(prompt_payload)
        except Exception:
            parsed = _mock_parse(brief.get("custom_prompt", ""), brief.get("personality"))
    else:
        parsed = _mock_parse(brief.get("custom_prompt", ""), brief.get("personality"))
    for group in ("exterior", "wheels", "interior", "bespoke"):
        flat.update({f"{group}.{k}": v for k, v in parsed.get(group, {}).items()})
    config = {"vehicle_id": vehicle_id, "exterior": {}, "wheels": {}, "interior": {},
              "bespoke": {}, "design_personality": parsed.get("design_personality"),
              "source": "ai"}
    apply_flat_values(config, flat)
    config, warnings = validate_configuration(config)
    return config
