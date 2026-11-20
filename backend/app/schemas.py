from typing import Any, Optional
from pydantic import BaseModel, Field

class DesignBrief(BaseModel):
    vehicle_id: str = "pagani_utopia"
    exterior_theme_id: Optional[str] = None
    interior_theme_id: Optional[str] = None
    personality: Optional[str] = None
    priority: Optional[str] = "balanced"
    custom_prompt: str = ""
    creativity: str = "balanced"

class VehicleConfiguration(BaseModel):
    vehicle_id: str
    exterior: dict[str, str] = Field(default_factory=dict)
    wheels: dict[str, str] = Field(default_factory=dict)
    interior: dict[str, str] = Field(default_factory=dict)
    bespoke: dict[str, str] = Field(default_factory=dict)
    design_personality: Optional[str] = None
    source: str = "manual"
    ai_provider: Optional[str] = None
    validation_warnings: list[str] = Field(default_factory=list)

class GenerateRequest(BaseModel):
    brief: DesignBrief
    count: int = Field(default=3, ge=1, le=3)

class ManualUpdate(BaseModel):
    changes: dict[str, Any]
