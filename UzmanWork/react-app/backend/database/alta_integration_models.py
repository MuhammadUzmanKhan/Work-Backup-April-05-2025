from pydantic import BaseModel


class AltaIntegrationError(Exception):
    pass


class AltaIntegrationNotFoundError(AltaIntegrationError):
    pass


class AltaIntegrationAuthorisationData(BaseModel):
    public_key: str
    private_key: str
    cert_id: int
    org_id: int

    class Config:
        orm_mode = True


class AltaIntegration(AltaIntegrationAuthorisationData):
    external_user_id: int | None = None
    cloud_key_credential_id: int | None = None

    class Config:
        orm_mode = True
