import random
import string

from pydantic import BaseModel, Field


class AWSCredentials(BaseModel):
    access_key: str
    secret_key: str
    token: str | None


class AwsSignToken(BaseModel):
    sign_token: str = Field(
        default_factory=lambda: "".join(
            random.choices(string.ascii_letters + string.digits, k=10)
        )
    )


class AwsSignRequest(BaseModel):
    sign_token: str
    # the websocket url to sign
    wss_url: str
    # additional headers to sign
    headers: dict[str, str]
