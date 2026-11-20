from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.catalogue import VEHICLES, EXTERIOR_THEMES, INTERIOR_THEMES
from app.schemas import DesignBrief, GenerateRequest, ManualUpdate
from app.services.ai_service import interpret_brief
from app.services.compatibility import validate_configuration
from app.repository import save_configuration, get_configuration, update_configuration

app = FastAPI(title=settings.app_name, version="0.1.0")
origins = [x.strip() for x in settings.frontend_origins.split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "pagani-ai-atelier"}

@app.get("/api/v1/vehicles")
def list_vehicles():
    return [{"id": v["id"], "name": v["name"]} for v in VEHICLES.values()]

@app.get("/api/v1/vehicles/{vehicle_id}/options")
def vehicle_options(vehicle_id: str):
    vehicle = VEHICLES.get(vehicle_id)
    if not vehicle:
        raise HTTPException(404, "Vehicle profile not found")
    return {"vehicle_id": vehicle_id, "options": vehicle["options"]}

@app.get("/api/v1/themes")
def themes(vehicle_id: str = "pagani_utopia"):
    if vehicle_id not in VEHICLES:
        raise HTTPException(404, "Vehicle profile not found")
    return {"vehicle_id": vehicle_id, "exterior": EXTERIOR_THEMES, "interior": INTERIOR_THEMES}

@app.post("/api/v1/ai/consult")
async def consult(brief: DesignBrief):
    try:
        config = await interpret_brief(brief.model_dump())
        return {"vehicle_id": brief.vehicle_id, "interpreted_configuration": config,
                "warnings": config.get("validation_warnings", []),
                "requires_customer_review": True}
    except ValueError as exc:
        raise HTTPException(422, str(exc))

@app.post("/api/v1/ai/generate")
async def generate(req: GenerateRequest):
    try:
        base = await interpret_brief(req.brief.model_dump())
        proposals = []
        # Three controlled variations: keep requested choices, then vary supported finishes.
        variants = [
            {},
            {"wheels.finish": "polished_silver"},
            {"wheels.finish": "dark_titanium"}
        ]
        for i in range(req.count):
            item = {**base, "exterior": dict(base["exterior"]), "wheels": dict(base["wheels"]),
                    "interior": dict(base["interior"]), "bespoke": dict(base["bespoke"])}
            if i > 0 and i < len(variants):
                override_finish = variants[i].get("wheels.finish")
                if override_finish:
                    item["wheels"]["finish"] = override_finish
            item["proposal_name"] = ["Original interpretation", "Polished interpretation", "Dark-detail interpretation"][i]
            item, _ = validate_configuration(item)
            saved = save_configuration(item)
            proposals.append(saved)
        return {"vehicle_id": req.brief.vehicle_id, "proposals": proposals,
                "note": "Demo proposals are catalogue-constrained; obtain manufacturer approval before treating as orderable."}
    except ValueError as exc:
        raise HTTPException(422, str(exc))

@app.get("/api/v1/configurations/{configuration_id}")
def read_configuration(configuration_id: str):
    item = get_configuration(configuration_id)
    if not item:
        raise HTTPException(404, "Configuration not found")
    return item

@app.patch("/api/v1/configurations/{configuration_id}")
def patch_configuration(configuration_id: str, update: ManualUpdate):
    item = get_configuration(configuration_id)
    if not item:
        raise HTTPException(404, "Configuration not found")
    # Only allow whitelisted dotted paths and validate each resulting value.
    allowed_groups = {"exterior", "wheels", "interior", "bespoke"}
    # Snapshot current values so rejected changes don't destroy existing data.
    snapshot = {g: dict(item.get(g, {})) for g in allowed_groups}
    for path, value in update.changes.items():
        parts = path.split(".")
        if len(parts) != 2 or parts[0] not in allowed_groups:
            raise HTTPException(422, f"Invalid customization path: {path}")
        item.setdefault(parts[0], {})[parts[1]] = value
    try:
        cleaned, warnings = validate_configuration(item)
    except ValueError as exc:
        raise HTTPException(422, str(exc))
    # Restore original values for keys that were stripped by validation (rejected input).
    for group in allowed_groups:
        for key, original in snapshot.get(group, {}).items():
            if key not in cleaned.get(group, {}):
                cleaned.setdefault(group, {})[key] = original
    update_configuration(configuration_id, cleaned)
    return {"configuration": cleaned, "warnings": warnings}

@app.post("/api/v1/configurations")
def create_configuration(payload: dict):
    try:
        cleaned, warnings = validate_configuration(payload)
        return save_configuration(cleaned)
    except ValueError as exc:
        raise HTTPException(422, str(exc))
