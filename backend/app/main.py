from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.catalogue import VEHICLES
from app.schemas import DesignBrief, GenerateRequest, ManualUpdate
from app.services.ai_service import interpret_brief
from app.services.compatibility import validate_configuration
from app.database import init_db, close_db, is_connected, connection_error
from app.repository import (
    save_configuration,
    get_configuration,
    update_configuration,
    get_design_versions,
    save_ai_proposal,
    get_vehicles,
    get_vehicle_options,
    get_themes,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize MongoDB Atlas connection & ensure collection indexes
    await init_db()
    yield
    # Gracefully close connection pool on shutdown
    await close_db()


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
origins = [x.strip() for x in settings.frontend_origins.split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    from app.database import is_connected as db_live, connection_error as db_err
    if not settings.mongodb_uri.strip():
        db_status = "unconfigured (local fallback active)"
    elif db_live:
        db_status = "connected"
    else:
        db_status = "disconnected"

    return {
        "status": "ok",
        "service": "pagani-ai-atelier",
        "database": db_status,
        "database_name": settings.mongodb_database if db_live else None,
        "database_error": db_err,
        "ai_provider": settings.ai_provider,
        "ai_model": settings.groq_model if settings.ai_provider == "groq" else settings.ollama_model,
        "ai_status": "ready" if (settings.ai_provider != "groq" or bool(settings.groq_api_key.strip())) else "mock fallback (GROQ_API_KEY unconfigured)",
    }


@app.get("/api/v1/vehicles")
async def list_vehicles():
    return await get_vehicles()


@app.get("/api/v1/vehicles/{vehicle_id}/options")
async def vehicle_options(vehicle_id: str):
    data = await get_vehicle_options(vehicle_id)
    if not data:
        raise HTTPException(404, "Vehicle profile not found")
    return data


@app.get("/api/v1/themes")
async def themes(vehicle_id: str = "pagani_utopia"):
    data = await get_themes(vehicle_id)
    if not data:
        raise HTTPException(404, "Vehicle profile not found")
    return data


@app.post("/api/v1/ai/consult")
async def consult(brief: DesignBrief):
    try:
        config = await interpret_brief(brief.model_dump())
        return {
            "vehicle_id": brief.vehicle_id,
            "interpreted_configuration": config,
            "source": config.get("source"),
            "ai_provider": config.get("ai_provider"),
            "warnings": config.get("validation_warnings", []),
            "requires_customer_review": True,
        }
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
            {"wheels.finish": "dark_titanium"},
        ]
        for i in range(req.count):
            item = {
                **base,
                "exterior": dict(base["exterior"]),
                "wheels": dict(base["wheels"]),
                "interior": dict(base["interior"]),
                "bespoke": dict(base["bespoke"]),
            }
            if i > 0 and i < len(variants):
                override_finish = variants[i].get("wheels.finish")
                if override_finish:
                    item["wheels"]["finish"] = override_finish
            item["proposal_name"] = [
                "Original interpretation",
                "Polished interpretation",
                "Dark-detail interpretation",
            ][i]
            item, _ = validate_configuration(item)
            saved = await save_configuration(item)
            # Record in ai_proposals collection
            await save_ai_proposal(saved, req.brief.model_dump())
            proposals.append(saved)

        return {
            "vehicle_id": req.brief.vehicle_id,
            "source": proposals[0].get("source") if proposals else "unknown",
            "ai_provider": proposals[0].get("ai_provider") if proposals else "unknown",
            "proposals": proposals,
            "note": "Demo proposals are catalogue-constrained; obtain manufacturer approval before treating as orderable.",
        }
    except ValueError as exc:
        raise HTTPException(422, str(exc))


@app.get("/api/v1/configurations/{configuration_id}")
async def read_configuration(configuration_id: str):
    item = await get_configuration(configuration_id)
    if not item:
        raise HTTPException(404, "Configuration not found")
    return item


@app.get("/api/v1/configurations/{configuration_id}/versions")
async def configuration_versions(configuration_id: str):
    """Retrieve historical revisions/snapshots for a design configuration."""
    item = await get_configuration(configuration_id)
    if not item:
        raise HTTPException(404, "Configuration not found")
    versions = await get_design_versions(configuration_id)
    return {"configuration_id": configuration_id, "versions": versions}


@app.patch("/api/v1/configurations/{configuration_id}")
async def patch_configuration(configuration_id: str, update: ManualUpdate):
    item = await get_configuration(configuration_id)
    if not item:
        raise HTTPException(404, "Configuration not found")

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

    updated = await update_configuration(configuration_id, cleaned, changes=update.changes)
    return {"configuration": updated, "warnings": warnings}


@app.post("/api/v1/configurations")
async def create_configuration(payload: dict):
    try:
        cleaned, warnings = validate_configuration(payload)
        saved = await save_configuration(cleaned)
        return saved
    except ValueError as exc:
        raise HTTPException(422, str(exc))
