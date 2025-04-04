from pydantic import BaseModel


class VersionCheckResponse(BaseModel):
    requires_update: bool
    submitted_version: str
    current_version: str
