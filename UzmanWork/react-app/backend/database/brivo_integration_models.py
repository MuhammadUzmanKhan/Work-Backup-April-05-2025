from pydantic import BaseModel


class BrivoIntegrationError(Exception):
    pass


class BrivoIntegrationNotFoundError(BrivoIntegrationError):
    pass


class BrivoIntegration(BaseModel):
    refresh_token: str
    api_key: str | None = None

    class Config:
        orm_mode = True
