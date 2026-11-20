from uuid import uuid4
from datetime import datetime, timezone
from typing import Optional
from app.database import get_db
from app.catalogue import VEHICLES, EXTERIOR_THEMES, INTERIOR_THEMES

# In-memory fallback stores when MongoDB is not connected
LOCAL_CONFIGURATIONS: dict[str, dict] = {}
LOCAL_VERSIONS: dict[str, list[dict]] = {}
LOCAL_PROPOSALS: dict[str, dict] = {}

# Backward compatibility alias
CONFIGURATIONS = LOCAL_CONFIGURATIONS


def _clean_doc(doc: Optional[dict]) -> Optional[dict]:
    """Helper to remove MongoDB internal _id field."""
    if not doc:
        return None
    d = dict(doc)
    d.pop("_id", None)
    return d


# ── Configuration Persistence ──────────────────────────────────────────

async def save_configuration(data: dict, user_id: Optional[str] = None) -> dict:
    """Save a new design configuration to MongoDB (or local fallback)."""
    db = get_db()
    item = dict(data)
    if "id" not in item:
        item["id"] = str(uuid4())
    now = datetime.now(timezone.utc).isoformat()
    item["created_at"] = item.get("created_at") or now
    item["updated_at"] = now
    item["version_number"] = item.get("version_number", 1)
    if user_id:
        item["user_id"] = user_id

    if db is not None:
        await db.design_configurations.update_one(
            {"id": item["id"]},
            {"$set": item},
            upsert=True
        )
        # Record initial version 1
        await create_design_version(item["id"], item, note="Initial creation")
    else:
        LOCAL_CONFIGURATIONS[item["id"]] = item
        LOCAL_VERSIONS.setdefault(item["id"], []).append({
            "id": str(uuid4()),
            "configuration_id": item["id"],
            "version_number": item["version_number"],
            "snapshot": dict(item),
            "created_at": now,
            "note": "Initial creation"
        })

    return _clean_doc(item)


async def get_configuration(config_id: str) -> Optional[dict]:
    """Retrieve configuration by ID."""
    db = get_db()
    if db is not None:
        doc = await db.design_configurations.find_one({"id": config_id})
        return _clean_doc(doc)
    return _clean_doc(LOCAL_CONFIGURATIONS.get(config_id))


async def update_configuration(config_id: str, data: dict, changes: Optional[dict] = None) -> Optional[dict]:
    """Update configuration, update timestamp, increment version, and record version snapshot."""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()

    current = await get_configuration(config_id)
    if not current:
        return None

    next_version = current.get("version_number", 1) + 1
    updated = {**current, **data, "id": config_id, "updated_at": now, "version_number": next_version}

    if db is not None:
        await db.design_configurations.update_one(
            {"id": config_id},
            {"$set": updated}
        )
        await create_design_version(config_id, updated, changes=changes, note="Manual customization update")
    else:
        LOCAL_CONFIGURATIONS[config_id] = updated
        LOCAL_VERSIONS.setdefault(config_id, []).append({
            "id": str(uuid4()),
            "configuration_id": config_id,
            "version_number": next_version,
            "snapshot": dict(updated),
            "changes": changes or {},
            "created_at": now,
            "note": "Manual customization update"
        })

    return _clean_doc(updated)


# ── Design Version History ─────────────────────────────────────────────

async def create_design_version(
    config_id: str,
    snapshot: dict,
    changes: Optional[dict] = None,
    note: str = ""
) -> dict:
    """Record an immutable version snapshot of a design configuration."""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    clean_snap = _clean_doc(snapshot)

    version_doc = {
        "id": str(uuid4()),
        "configuration_id": config_id,
        "version_number": clean_snap.get("version_number", 1),
        "snapshot": clean_snap,
        "changes": changes or {},
        "created_at": now,
        "note": note,
    }

    if db is not None:
        await db.design_versions.insert_one(version_doc)
    else:
        LOCAL_VERSIONS.setdefault(config_id, []).append(version_doc)

    return _clean_doc(version_doc)


async def get_design_versions(config_id: str) -> list[dict]:
    """Retrieve full revision history for a design configuration."""
    db = get_db()
    if db is not None:
        cursor = db.design_versions.find({"configuration_id": config_id}).sort("version_number", 1)
        docs = await cursor.to_list(length=100)
        return [_clean_doc(d) for d in docs]
    return [_clean_doc(d) for d in LOCAL_VERSIONS.get(config_id, [])]


# ── AI Proposals Logging ───────────────────────────────────────────────

async def save_ai_proposal(proposal: dict, brief: dict) -> dict:
    """Store generated AI proposal with its originating brief."""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    record = {
        "id": proposal.get("id") or str(uuid4()),
        "vehicle_id": proposal.get("vehicle_id", "pagani_utopia"),
        "proposal_name": proposal.get("proposal_name", "AI Proposal"),
        "configuration": _clean_doc(proposal),
        "customer_brief": brief,
        "created_at": now,
    }

    if db is not None:
        await db.ai_proposals.update_one(
            {"id": record["id"]},
            {"$set": record},
            upsert=True
        )
    else:
        LOCAL_PROPOSALS[record["id"]] = record

    return _clean_doc(record)


# ── Catalogue & Themes Retrieval ───────────────────────────────────────

async def get_vehicles() -> list[dict]:
    """Retrieve supported vehicle profiles."""
    db = get_db()
    if db is not None:
        cursor = db.vehicles.find({})
        docs = await cursor.to_list(length=50)
        if docs:
            return [{"id": d["id"], "name": d["name"]} for d in docs]
    return [{"id": v["id"], "name": v["name"]} for v in VEHICLES.values()]


async def get_vehicle_options(vehicle_id: str) -> Optional[dict]:
    """Retrieve configuration options for a vehicle."""
    db = get_db()
    if db is not None:
        cursor = db.vehicle_options.find({"vehicle_id": vehicle_id})
        docs = await cursor.to_list(length=100)
        if docs:
            options = {d["option_path"]: d["allowed_values"] for d in docs}
            return {"vehicle_id": vehicle_id, "options": options}

    vehicle = VEHICLES.get(vehicle_id)
    if not vehicle:
        return None
    return {"vehicle_id": vehicle_id, "options": vehicle["options"]}


async def get_themes(vehicle_id: str = "pagani_utopia") -> Optional[dict]:
    """Retrieve exterior and interior themes."""
    if vehicle_id not in VEHICLES:
        return None

    db = get_db()
    if db is not None:
        ext_cursor = db.design_themes.find({"vehicle_id": vehicle_id, "theme_type": "exterior"})
        int_cursor = db.design_themes.find({"vehicle_id": vehicle_id, "theme_type": "interior"})
        ext_docs = await ext_cursor.to_list(length=50)
        int_docs = await int_cursor.to_list(length=50)
        if ext_docs and int_docs:
            return {
                "vehicle_id": vehicle_id,
                "exterior": [_clean_doc(d) for d in ext_docs],
                "interior": [_clean_doc(d) for d in int_docs],
            }

    return {
        "vehicle_id": vehicle_id,
        "exterior": EXTERIOR_THEMES,
        "interior": INTERIOR_THEMES,
    }


def clear_local_store():
    """Testing helper to reset local in-memory dictionaries."""
    LOCAL_CONFIGURATIONS.clear()
    LOCAL_VERSIONS.clear()
    LOCAL_PROPOSALS.clear()
