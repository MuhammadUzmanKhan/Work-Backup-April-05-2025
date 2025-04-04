from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, Field, validator

from backend import ws_models
from backend.utils import AwareDatetime
from backend.validators import validate_end_time_after_start


class TextSearchRequestBase(BaseModel):
    text_query: str
    # Start and end time of the search range
    start_time: AwareDatetime
    end_time: AwareDatetime
    # Return up to top_k results
    top_k: int

    @validator("end_time")
    def end_time_validate(
        cls, end_time: AwareDatetime, values: dict[str, Any]
    ) -> AwareDatetime:
        return validate_end_time_after_start(end_time, values)


class SingleCameraTextSearchRequest(TextSearchRequestBase):
    # The MAC addresses to search in.
    mac_address: str
    # This shares the same representation as the one in UserAlertSetting
    roi_polygon: list[list[float]] | None = None


class MultiCameraTextSearchRequest(TextSearchRequestBase):
    # The MAC addresses to search in.
    mac_addresses: list[str]


class SearchRequestBody(BaseModel):
    # This is used for backend to edge communication.
    mac_addresses: list[str]
    request_id: int
    text_query: str
    start_time: AwareDatetime
    end_time: AwareDatetime
    top_k: int


class SearchAPIMessageFrame(BaseModel):
    command: Literal[ws_models.APICommands.MESSAGE] = ws_models.APICommands.MESSAGE
    body: SearchRequestBody


SearchAPIFrame = Annotated[
    Union[
        ws_models.APIConnectFrame,
        ws_models.APIConnectedFrame,
        ws_models.APISubscribeFrame,
        ws_models.APIErrorFrame,
        SearchAPIMessageFrame,
    ],
    Field(discriminator="command"),
]
