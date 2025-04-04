from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field

from backend import ws_models
from backend.utils import AwareDatetime


class DiscoveryRequestBody(BaseModel):
    request_time: AwareDatetime


class DiscoveryMessageFrame(BaseModel):
    command: Literal[ws_models.APICommands.MESSAGE] = ws_models.APICommands.MESSAGE
    body: DiscoveryRequestBody


DiscoveryAPIFrame = Annotated[
    Union[
        ws_models.APIConnectFrame,
        ws_models.APIConnectedFrame,
        ws_models.APISubscribeFrame,
        ws_models.APIErrorFrame,
        DiscoveryMessageFrame,
    ],
    Field(discriminator="command"),
]
