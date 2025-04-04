from __future__ import annotations

from pydantic import BaseModel, Field


class CreateTagRequest(BaseModel):
    name: str = Field(..., min_length=2)


class TagResponse(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True
