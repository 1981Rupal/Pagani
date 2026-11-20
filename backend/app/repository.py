from uuid import uuid4
from datetime import datetime, timezone

CONFIGURATIONS: dict[str, dict] = {}

def save_configuration(data: dict) -> dict:
    item = dict(data)
    item["id"] = str(uuid4())
    item["created_at"] = datetime.now(timezone.utc).isoformat()
    item["updated_at"] = item["created_at"]
    CONFIGURATIONS[item["id"]] = item
    return item

def get_configuration(config_id: str):
    return CONFIGURATIONS.get(config_id)

def update_configuration(config_id: str, data: dict):
    if config_id not in CONFIGURATIONS:
        return None
    CONFIGURATIONS[config_id].update(data)
    CONFIGURATIONS[config_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    return CONFIGURATIONS[config_id]
