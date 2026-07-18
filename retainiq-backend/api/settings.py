from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

_settings = {
    "name": "John Doe",
    "role": "Customer Success Manager",
    "company": "RetainIQ",
}


class SettingsUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    company: Optional[str] = None


@router.get("/settings")
def settings():
    return _settings


@router.post("/settings")
def update_settings(payload: SettingsUpdate):
    if payload.name is not None:
        _settings["name"] = payload.name
    if payload.role is not None:
        _settings["role"] = payload.role
    if payload.company is not None:
        _settings["company"] = payload.company
    return _settings