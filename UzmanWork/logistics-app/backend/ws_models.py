import enum
from typing import Annotated, Literal, Union

import pydantic


class ProtocolError(Exception):
    pass


class SubscribeBody(pydantic.BaseModel):
    nvr_uuid: str


class ConnectBody(pydantic.BaseModel):
    auth_token: str


class APICommands(str, enum.Enum):
    CONNECT = "CONNECT"
    CONNECTED = "CONNECTED"
    SUBSCRIBE = "SUBSCRIBE"
    MESSAGE = "MESSAGE"
    ERROR = "ERROR"


class APIConnectFrame(pydantic.BaseModel):
    command: Literal[APICommands.CONNECT] = APICommands.CONNECT
    body: ConnectBody


class APIErrorFrame(pydantic.BaseModel):
    command: Literal[APICommands.ERROR] = APICommands.ERROR
    details: str


class APIConnectedFrame(pydantic.BaseModel):
    command: Literal[APICommands.CONNECTED] = APICommands.CONNECTED


class APISubscribeFrame(pydantic.BaseModel):
    command: Literal[APICommands.SUBSCRIBE] = APICommands.SUBSCRIBE
    body: SubscribeBody


BasicAPIFrame = Annotated[
    Union[APIConnectFrame, APIConnectedFrame, APISubscribeFrame, APIErrorFrame],
    pydantic.Field(discriminator="command"),
]
