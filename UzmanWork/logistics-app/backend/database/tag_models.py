from __future__ import annotations

from pydantic import BaseModel


class Tag(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True
