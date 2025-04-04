import asyncio
import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone

import aio_pika
import dateutil
import sentry_sdk
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text

from backend import auth, auth_models, dependencies, logging_config
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.boto_utils import BotoIotDataClient
from backend.database import database, orm
from backend.dependencies import get_mq_connection
from backend.fastapi_utils import WithResponseExcludeNone
from backend.iot_core.db_utils import IOTCoreFeature, is_iot_core_feature_enabled
from backend.llm import LargeLanguageModel
from backend.models import (
    AccessRestrictions,
    TextSearchResponseMessage,
    TextSearchResponseMessageBase,
)
from backend.monitor.alert import AlertNVR, AlertOrgGrouped, AlertSeverity
from backend.monitor.alert_types import AlertType
from backend.router_utils import (
    get_camera_from_mac_address_or_fail,
    get_cameras_from_mac_address_or_fail,
    get_nvr_response_from_uuid_or_fail,
    get_nvr_responses_from_uuid_or_fail,
)
from backend.slack_client import SlackClient
from backend.text_search import prompts, protocol_models
from backend.text_search.utils import (
    fill_response_messages_with_camera,
    send_text_search_request,
    wait_for_text_search_response,
)
from backend.utils import AwareDatetime

logger = logging.getLogger(logging_config.LOGGER_NAME)

text_search_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/text_search",
        tags=["text_search"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@text_search_router.post("/single_camera_search", deprecated=True)
async def search_single_camera(
    search_request: protocol_models.SingleCameraTextSearchRequest,
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    iot_data_client: BotoIotDataClient = Depends(dependencies.get_iot_data_client),
    db: database.Database = Depends(dependencies.get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    slack_client: SlackClient = Depends(dependencies.get_slack_client),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.SEARCHED_SINGLE_CAMERA, ["mac_address", "text_query"])
    ),
) -> list[TextSearchResponseMessage]:

    text_search_messages = await perform_single_camera_search(
        search_request,
        mq_connection=mq_connection,
        iot_data_client=iot_data_client,
        db=db,
        app_user=app_user,
        access=access,
        slack_client=slack_client,
    )
    async with db.tenant_session() as session:
        return await fill_response_messages_with_camera(
            session, access, text_search_messages[: search_request.top_k]
        )


@text_search_router.post("/multi_camera_search", deprecated=True)
async def search_multi_camera(
    search_request: protocol_models.MultiCameraTextSearchRequest,
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    iot_data_client: BotoIotDataClient = Depends(dependencies.get_iot_data_client),
    db: database.Database = Depends(dependencies.get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    slack_client: SlackClient = Depends(dependencies.get_slack_client),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.SEARCHED_MULTIPLE_CAMERAS, ["mac_address", "text_query"]
        )
    ),
) -> list[TextSearchResponseMessage]:
    text_search_messages = await perform_multi_camera_search(
        search_request,
        mq_connection=mq_connection,
        iot_data_client=iot_data_client,
        db=db,
        app_user=app_user,
        access=access,
        slack_client=slack_client,
    )
    async with db.tenant_session() as session:
        return await fill_response_messages_with_camera(
            session, access, text_search_messages[: search_request.top_k]
        )


@text_search_router.post("/perform_single_camera_search")
async def perform_single_camera_search(
    search_request: protocol_models.SingleCameraTextSearchRequest,
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    iot_data_client: BotoIotDataClient = Depends(dependencies.get_iot_data_client),
    db: database.Database = Depends(dependencies.get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    slack_client: SlackClient = Depends(dependencies.get_slack_client),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.SEARCHED_SINGLE_CAMERA, ["mac_address", "text_query"])
    ),
) -> list[TextSearchResponseMessageBase]:
    async with db.tenant_session() as session:
        requested_camera = await get_camera_from_mac_address_or_fail(
            session, access, search_request.mac_address
        )

        nvr = await get_nvr_response_from_uuid_or_fail(
            session, access, requested_camera.nvr_uuid
        )
        if not nvr.is_online:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="The NVR is not online"
            )
        mac_addresses = [search_request.mac_address]

        new_request = await orm.TextSearchRequest.new_request(
            session,
            mac_addresses,
            search_request.text_query,
            search_request.start_time,
            search_request.end_time,
            app_user.user_email,
            query_time=AwareDatetime.now(tz=timezone.utc),
        )
        request_id = new_request.id

    await send_text_search_request(
        request_id=request_id,
        request=search_request,
        mq_connection=mq_connection,
        iot_data_client=iot_data_client,
        nvr_uuid=requested_camera.nvr_uuid,
        mac_addresses=mac_addresses,
        use_iot_core=await is_iot_core_feature_enabled(
            db, IOTCoreFeature.TEXT_SEARCH, app_user.tenant
        ),
    )

    async with db.tenant_session() as session:
        text_search_messages, response_feedback = await wait_for_text_search_response(
            session=session,
            expected_nvr_uuids=set([requested_camera.nvr_uuid]),
            request_id=request_id,
        )

    if not response_feedback.all_nvrs_have_responded:
        async with db.tenant_session() as session:
            org_name = await orm.Organization.get_org_name_or_unknown_from_session(
                session
            )

        await slack_client.send_alert(
            AlertNVR(
                alert_type=AlertType.TEXT_SEARCH_NVR_FAILED,
                alert_severity=AlertSeverity.WARNING,
                nvr_uuid=requested_camera.nvr_uuid,
                org_name=org_name,
                detailed_info={
                    "message": (
                        f"[Text Search] {requested_camera.nvr_uuid=} did not respond"
                        f" to {search_request=} "
                    )
                },
            )
        )

    async with db.tenant_session() as session:
        text_search_messages = await orm.PerceptionObjectEvent.process_roi_or_fail(
            session,
            requested_camera.mac_address,
            search_request.roi_polygon,
            text_search_messages,
        )

    return text_search_messages[: search_request.top_k]


@text_search_router.post("/perform_multi_camera_search")
async def perform_multi_camera_search(
    search_request: protocol_models.MultiCameraTextSearchRequest,
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    iot_data_client: BotoIotDataClient = Depends(dependencies.get_iot_data_client),
    db: database.Database = Depends(dependencies.get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    slack_client: SlackClient = Depends(dependencies.get_slack_client),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.SEARCHED_MULTIPLE_CAMERAS, ["mac_address", "text_query"]
        )
    ),
) -> list[TextSearchResponseMessageBase]:
    async with db.tenant_session() as session:
        # Find all requested mac addresses and their associated NVRs here
        requested_cameras = await get_cameras_from_mac_address_or_fail(
            session, access, mac_addresses=(search_request.mac_addresses)
        )
        nvr_to_mac_addresses = defaultdict(list)
        for camera in requested_cameras:
            nvr_to_mac_addresses[camera.nvr_uuid].append(camera.mac_address)

        nvrs_uuids = list(nvr_to_mac_addresses.keys())
        # Remove the nvrs that are not online
        nvrs = await get_nvr_responses_from_uuid_or_fail(session, access, nvrs_uuids)
        online_nvrs_uuids = {nvr.uuid for nvr in nvrs if nvr.is_online}
        for nvr_uuid in nvrs_uuids:
            if nvr_uuid not in online_nvrs_uuids:
                del nvr_to_mac_addresses[nvr_uuid]

        all_mac_addresses = []

        for mac_addresses in nvr_to_mac_addresses.values():
            all_mac_addresses += mac_addresses

        if len(all_mac_addresses) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "No live cameras found within user's access. Please make sure there"
                    " are live cameras available and accessible"
                ),
            )

        new_request = await orm.TextSearchRequest.new_request(
            session,
            all_mac_addresses,
            search_request.text_query,
            search_request.start_time,
            search_request.end_time,
            app_user.user_email,
            query_time=AwareDatetime.now(tz=timezone.utc),
        )
        request_id = new_request.id

    # Send the text search request to all nvrs in parallel
    await asyncio.gather(
        *[
            send_text_search_request(
                request_id=request_id,
                request=search_request,
                mq_connection=mq_connection,
                iot_data_client=iot_data_client,
                nvr_uuid=nvr_uuid,
                mac_addresses=mac_addresses,
                use_iot_core=await is_iot_core_feature_enabled(
                    db, IOTCoreFeature.TEXT_SEARCH, app_user.tenant
                ),
            )
            for nvr_uuid, mac_addresses in nvr_to_mac_addresses.items()
        ]
    )

    async with db.tenant_session() as session:
        text_search_messages, response_feedback = await wait_for_text_search_response(
            session=session,
            expected_nvr_uuids=set(nvr_to_mac_addresses.keys()),
            request_id=request_id,
        )

    if not response_feedback.all_nvrs_have_responded:
        async with db.tenant_session() as session:
            org_name = await orm.Organization.get_org_name_or_unknown_from_session(
                session
            )

        await slack_client.send_alert(
            AlertOrgGrouped(
                alert_type=AlertType.TEXT_SEARCH_NVR_FAILED,
                alert_severity=AlertSeverity.WARNING,
                org_name=org_name,
                detailed_info={
                    "message": (
                        "[Text Search] missing feedback from nvrs:"
                        f" {response_feedback=} for {search_request=}"
                    )
                },
            )
        )

    return text_search_messages[: search_request.top_k]


@text_search_router.post("/assistant")
async def assistant_query_endpoint(
    query: str,
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    llm: LargeLanguageModel = Depends(dependencies.get_llm),
    db: database.Database = Depends(dependencies.get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.USED_AI_ASSISTANT, ["query"])
    ),
) -> str:
    """Endpoint to send a message to Coram Assistant."""

    sentry_sdk.set_user({"email": app_user.user_email})

    sentry_sdk.set_tag("nlp_assistant_question", query)

    now = datetime.now(dateutil.tz.gettz("PST8PDT"))
    sql_prompt = prompts.SQL_PROMPT.format(
        time=now.strftime("%H:%M:%S"),
        today_date=now.strftime("%A %Y-%m-%d"),
        yesterday_date=(now - timedelta(1)).strftime("%A %Y-%m-%d"),
        date_0=(now - timedelta(0)).strftime("%A %Y-%m-%d"),
        date_1=(now - timedelta(1)).strftime("%A %Y-%m-%d"),
        date_2=(now - timedelta(2)).strftime("%A %Y-%m-%d"),
        date_3=(now - timedelta(3)).strftime("%A %Y-%m-%d"),
        date_4=(now - timedelta(4)).strftime("%A %Y-%m-%d"),
        date_5=(now - timedelta(5)).strftime("%A %Y-%m-%d"),
        date_6=(now - timedelta(6)).strftime("%A %Y-%m-%d"),
        question=query,
    )

    sql_code = llm.generate_code(sql_prompt)

    if sql_code.startswith("```sql"):
        db_query = prompts.SQL_PREFIX + sql_code.lstrip("```sql").rstrip("```")
    else:
        sentry_sdk.set_context(
            "LLM", {"query": query, "sql_prompt": sql_prompt, "sql_code": sql_code}
        )
        return "Can't answer this question"

    async with db.tenant_session() as session:
        # make sure query is executed in PST8PDT timezone
        await session.execute(text("SET TIME ZONE 'PST8PDT';"))
        # execute query
        cursor = await session.execute(text(db_query))
        db_response = cursor.fetchall()
        # convert any resulted time cell to PST8PDT timezone
        llm_response = [
            tuple(
                (
                    cell.astimezone(dateutil.tz.gettz("PST8PDT"))
                    if isinstance(cell, datetime)
                    else cell
                )
                for cell in row
            )
            for row in db_response
        ]
        response = str(llm_response)

    summary_prompt = (
        sql_prompt + sql_code + prompts.SQL_SUMMARY_PROMPT.format(response=response)
    )

    answer = llm.generate_text(summary_prompt)

    sentry_sdk.set_context(
        "LLM",
        {
            "query": query,
            "sql_prompt": sql_prompt,
            "sql_code": sql_code,
            "db_result": response,
            "answer": answer,
        },
    )

    sentry_sdk.set_tag("nlp_assistant_answer", answer)
    sentry_sdk.flush()

    return answer
