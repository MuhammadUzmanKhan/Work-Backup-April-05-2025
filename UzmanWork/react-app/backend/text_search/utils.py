import asyncio
import logging

import aio_pika

from backend import logging_config, message_queue, ws_utils
from backend.boto_utils import BotoIotDataClient
from backend.constants import (
    MAX_TEXT_SEARCH_RETRIES,
    ROI_NLP_SEARCH_TOP_K_RATIO,
    TEXT_SEARCH_RETRY_INTERVAL_S,
)
from backend.database import orm
from backend.database.models import TextSearchNVRsFeedback
from backend.database.session import TenantAwareAsyncSession
from backend.iot_core.utils import (
    TEXT_SEARCH_IOT_QUEUE_FACTORY,
    send_msg_to_nvr_through_iot,
)
from backend.models import (
    AccessRestrictions,
    TextSearchResponseMessage,
    TextSearchResponseMessageBase,
)
from backend.router_utils import get_camera_response_from_mac_address_or_fail
from backend.text_search import protocol_models

logger = logging.getLogger(logging_config.LOGGER_NAME)


async def send_text_search_request(
    request_id: int,
    request: (
        protocol_models.SingleCameraTextSearchRequest
        | protocol_models.MultiCameraTextSearchRequest
    ),
    mq_connection: aio_pika.abc.AbstractRobustConnection,
    iot_data_client: BotoIotDataClient,
    nvr_uuid: str,
    mac_addresses: list[str],
    use_iot_core: bool,
) -> None:
    """Send the text search request to all nvrs"""

    request_top_k = request.top_k
    if (
        isinstance(request, protocol_models.SingleCameraTextSearchRequest)
        and request.roi_polygon is not None
    ):
        request_top_k = ROI_NLP_SEARCH_TOP_K_RATIO * request.top_k

    message = protocol_models.SearchRequestBody(
        mac_addresses=mac_addresses,
        request_id=request_id,
        text_query=request.text_query,
        start_time=request.start_time,
        end_time=request.end_time,
        top_k=request_top_k,
    )

    if use_iot_core:
        iot_queue_settings = TEXT_SEARCH_IOT_QUEUE_FACTORY(nvr_uuid)
        await send_msg_to_nvr_through_iot(
            iot_queue_settings, message.json(), iot_data_client
        )
    else:
        queue_settings = ws_utils.TEXT_SEARCH_QUEUE_FACTORY(nvr_uuid)
        await message_queue.publish_message(
            mq_connection=mq_connection, queue_settings=queue_settings, message=message
        )


async def wait_for_text_search_response(
    session: TenantAwareAsyncSession, expected_nvr_uuids: set[str], request_id: int
) -> tuple[list[TextSearchResponseMessageBase], TextSearchNVRsFeedback]:
    """Wait for the text search response from all nvrs"""
    feedback = TextSearchNVRsFeedback(
        expected_nvr_uuids=expected_nvr_uuids, responded_nvr_uuids=set()
    )
    for _ in range(MAX_TEXT_SEARCH_RETRIES):
        feedback = await orm.TextSearchResponseStatus.have_responses_returned(
            session, request_id, expected_nvr_uuids
        )
        if feedback.all_nvrs_have_responded:
            break
        await asyncio.sleep(TEXT_SEARCH_RETRY_INTERVAL_S)

    text_search_messages = await orm.TextSearchResponse.get_text_search_response(
        session, request_id
    )
    return text_search_messages, feedback


# TODO(@lberg): remove. We should not return the camera response here
# it significantly increases the size of the response
async def fill_response_messages_with_camera(
    session: TenantAwareAsyncSession,
    access: AccessRestrictions,
    text_search_messages: list[TextSearchResponseMessageBase],
) -> list[TextSearchResponseMessage]:
    results: list[TextSearchResponseMessage] = []
    for message in text_search_messages:
        camera_response = await get_camera_response_from_mac_address_or_fail(
            session, access, message.mac_address
        )
        results.append(
            TextSearchResponseMessage(**message.dict(), camera=camera_response)
        )
    return results
