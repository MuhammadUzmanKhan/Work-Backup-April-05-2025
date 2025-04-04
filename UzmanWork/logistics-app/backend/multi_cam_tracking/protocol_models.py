from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, Field, root_validator

from backend import ws_models
from backend.database.models import PcpObjectIdentifier
from backend.utils import AwareDatetime


class EmbeddingRequestBody(BaseModel):
    """EmbeddingRequestBody is the request body for the embedding service.

    ClipService doesn't process every detection. So the object
    backend requests may not have the corresponding embedding. Due to this,
    backend requests for a list of objects appeared within a small time range
    and ranked by their time gap to the timestamp of interest.
    This service on the edge side should processes this list of objects one by
    one and returns the first embedding matched.
    """

    # This is used for backend to edge communication.
    request_id: int
    mac_address: str
    objects: list[PcpObjectIdentifier]


class EmbeddingAPIMessageFrame(BaseModel):
    command: Literal[ws_models.APICommands.MESSAGE] = ws_models.APICommands.MESSAGE
    body: EmbeddingRequestBody


EmbeddingAPIFrame = Annotated[
    Union[
        ws_models.APIConnectFrame,
        ws_models.APIConnectedFrame,
        ws_models.APISubscribeFrame,
        ws_models.APIErrorFrame,
        EmbeddingAPIMessageFrame,
    ],
    Field(discriminator="command"),
]


class JourneyRequestBody(BaseModel):
    # This is used for backend to edge communication.
    # TODO(VAS-3842): remove the backward compatibility changes
    request_id: int
    mac_addresses: list[str]
    embedding: list[float]
    clip_version: str | None = None
    object_time: AwareDatetime | None = None
    top_k: int | None = None
    search_start_time: AwareDatetime | None = None
    search_end_time: AwareDatetime | None = None

    @root_validator(skip_on_failure=True)
    def check_search_times(cls, values: dict[str, Any]) -> dict[str, Any]:
        if (
            "object_time" not in values
            and "search_start_time" not in values
            and "search_end_time" not in values
        ):
            raise ValueError(
                "Either object_time or search_start_time/search_end_time must "
                "be specified!"
            )

        if ("search_start_time" in values and "search_end_time" not in values) or (
            "search_start_time" not in values and "search_end_time" in values
        ):
            raise ValueError(
                "Both search_start_time and search_end_time must be specified!"
            )
        return values


class JourneyAPIMessageFrame(BaseModel):
    command: Literal[ws_models.APICommands.MESSAGE] = ws_models.APICommands.MESSAGE
    body: JourneyRequestBody


JourneyAPIFrame = Annotated[
    Union[
        ws_models.APIConnectFrame,
        ws_models.APIConnectedFrame,
        ws_models.APISubscribeFrame,
        ws_models.APIErrorFrame,
        JourneyAPIMessageFrame,
    ],
    Field(discriminator="command"),
]
