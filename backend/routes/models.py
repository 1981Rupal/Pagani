"""
GET /api/models — the live side of the Collection.

The frontend ships the rich content (stories, component specs) with its build.
This endpoint answers only what changes at runtime: how many build slots remain.

Until `backend/db.py` (shared) exists, slot counts come from SEED below.
When Mongo lands, replace `_slots_taken()` with a count over the
`reservations` collection, grouped by model ID. The response shape stays the same.
See ARCHITECTURE.md §3.
"""

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["models"])

ModelId = Literal["utopia-roadster", "utopia-coupe", "codalunga-speedster"]


class ModelSummary(BaseModel):
    id: ModelId
    name: str
    unitsBuilt: int | None
    slotsRemaining: int | None
    experience: Literal["3d", "placeholder"]


# Published build numbers. Slots taken are placeholders until reservations exist.
SEED: list[dict] = [
    {"id": "utopia-roadster", "name": "Utopia Roadster", "unitsBuilt": 130, "experience": "3d"},
    {"id": "utopia-coupe", "name": "Utopia Coupé", "unitsBuilt": 99, "experience": "placeholder"},
    {"id": "codalunga-speedster", "name": "Huayra Codalunga Speedster", "unitsBuilt": 10, "experience": "placeholder"},
]


def _slots_taken(model_id: str) -> int | None:
    # TODO(db): count confirmed reservations for model_id. None = unknown.
    return None


def _summary(m: dict) -> ModelSummary:
    taken = _slots_taken(m["id"])
    remaining = None if taken is None or m["unitsBuilt"] is None else max(0, m["unitsBuilt"] - taken)
    return ModelSummary(**m, slotsRemaining=remaining)


@router.get("/models", response_model=list[ModelSummary])
async def list_models() -> list[ModelSummary]:
    return [_summary(m) for m in SEED]


@router.get("/models/{model_id}", response_model=ModelSummary)
async def get_model(model_id: ModelId) -> ModelSummary:
    for m in SEED:
        if m["id"] == model_id:
            return _summary(m)
    raise HTTPException(status_code=404, detail="Unknown model")
