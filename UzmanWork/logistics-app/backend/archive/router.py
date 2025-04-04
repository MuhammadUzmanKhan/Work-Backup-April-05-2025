import logging

import aio_pika
from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import AnyHttpUrl, EmailStr
from starlette.datastructures import URL

from backend import auth, auth_models, logging_config
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.alert.alert_sending import (
    format_shared_archive_message,
    send_shared_archive_email,
)
from backend.archive.models import (
    ArchiveAddClipRequest,
    ArchiveClipParams,
    ArchiveCommentRequest,
    ArchiveCommentResponse,
    ArchiveRequest,
    ArchiveResponse,
    ArchiveSummaryResponse,
    SetArchiveTagsRequest,
    ShareArchiveRequest,
)
from backend.archive.utils import (
    archive_request_kvs_if_not_exists,
    check_user_can_access_archive,
    check_user_can_access_archive_clip,
    get_archive_retention,
    get_user_archives,
    retrieve_comment_responses,
)
from backend.boto_utils import BotoIotDataClient, BotoSessionFn
from backend.clip_data.models import ClipArchiveRequest
from backend.clip_data.utils import link_clip_data_to_archive
from backend.database import database, orm
from backend.database.models import (
    ArchiveCreate,
    ClipData,
    ClipDataCreate,
    SharedArchiveCreate,
)
from backend.database.orm.orm_archive import ArchiveError
from backend.database.orm.orm_archived_thumbnails import ArchivedThumbnailsNotFound
from backend.dependencies import (
    get_aws_region,
    get_backend_database,
    get_backend_envs,
    get_backend_secrets,
    get_boto_session_maker,
    get_email_client,
    get_iot_data_client,
    get_mq_connection,
    get_replaced_master_playlist_url,
    get_value_store,
)
from backend.email_sending import EmailClient
from backend.envs import BackendEnvs, BackendSecrets
from backend.fastapi_utils import WithResponseExcludeNone
from backend.iot_core.db_utils import IOTCoreFeature, is_iot_core_feature_enabled
from backend.kinesis_api.errors import KinesisError
from backend.kinesis_api.models import (
    KinesisArchivedVideoClipRequest,
    KinesisStreamCreationRequest,
)
from backend.kinesis_api.utils import get_kinesis_clip_url
from backend.models import AccessRestrictions
from backend.router_utils import get_camera_from_mac_address_or_fail
from backend.task_worker.background_task import (
    archive_thumbnails_task,
    ensure_clip_is_archived_task,
)
from backend.thumbnail.models import ThumbnailResponse
from backend.thumbnail.s3_sign_url import sign_thumbnails
from backend.utils import AwareDatetime
from backend.value_store import ValueStore

archive_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/archive",
        tags=["archives"],
        generate_unique_id_function=lambda route: route.name,
    )
)

logger = logging.getLogger(logging_config.LOGGER_NAME)


# TODO(@lberg): this function is not cleaning up on failure!
# https://orcamobilityai.atlassian.net/browse/VAS-2990
@archive_router.post("/")
async def create_archive(
    create_archive_request: ArchiveRequest,
    db: database.Database = Depends(get_backend_database),
    boto_session_maker: BotoSessionFn = Depends(get_boto_session_maker),
    iot_data_client: BotoIotDataClient = Depends(get_iot_data_client),
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    envs: BackendEnvs = Depends(get_backend_envs),
    playlist_replace_url: URL = Depends(get_replaced_master_playlist_url),
    value_store: ValueStore = Depends(get_value_store),
    _access_logger: None = Depends(
        AccessLogger(
            UserActions.CREATED_A_NEW_ARCHIVE,
            ["mac_address", "start_time", "end_time", "archive_description"],
        )
    ),
) -> int:
    async with db.tenant_session() as session:
        camera = await get_camera_from_mac_address_or_fail(
            session, access, create_archive_request.clip_request.mac_address
        )
        archive = await orm.Archive.create_archive(
            session,
            ArchiveCreate(
                # TODO(@lberg): can we move email validation to app_user?
                owner_user_email=EmailStr(app_user.user_email),
                description=create_archive_request.archive_description,
                title=create_archive_request.title,
                creation_time=AwareDatetime.utcnow(),
                tags=create_archive_request.tags,
            ),
        )
        clip_creation_time = AwareDatetime.utcnow()
        clip_data_row = await orm.orm_clip_data.ClipData.create_or_retrieve_clip_data(
            session,
            ClipDataCreate(
                mac_address=create_archive_request.clip_request.mac_address,
                start_time=create_archive_request.clip_request.start_time,
                end_time=create_archive_request.clip_request.end_time,
                creation_time=clip_creation_time,
            ),
        )
        await session.flush()
        clip_data = ClipData.from_orm(clip_data_row)

    # Check if kvs stream exists or not, create if not exists.
    # After creation, bump up the retention hours to a year later
    # since it is is an archive video.
    try:
        await archive_request_kvs_if_not_exists(
            camera=camera,
            clip_data=clip_data,
            kinesis_stream_request=KinesisStreamCreationRequest(
                retention_duration=get_archive_retention(envs.environment_name)
            ),
            boto_session_maker=boto_session_maker,
            iot_data_client=iot_data_client,
            mq_connection=mq_connection,
            db=db,
            value_store=value_store,
            master_playlist_redirect_url=playlist_replace_url,
            tenant=app_user.tenant,
            use_iot_core=await is_iot_core_feature_enabled(
                db, IOTCoreFeature.VIDEO, app_user.tenant
            ),
        )
    except KinesisError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating kinesis stream: {e}",
        ) from e

    # Now the ClipData entry should have all the necessary information populated
    # (s3_path, kvs_stream_name, expiration_time), so we can link it to the archive
    await link_clip_data_to_archive(
        clip_id=clip_data.id,
        archive_id=archive.id,
        db=db,
        user_email=app_user.user_email,
    )

    if clip_data.s3_path is not None:
        return archive.id

    task_data = ClipArchiveRequest(
        mac_address=clip_data.mac_address,
        nvr_uuid=camera.nvr_uuid,
        clip_id=clip_data.id,
        start_time=clip_data.start_time,
        end_time=clip_data.end_time,
        tenant=app_user.tenant,
        video_orientation_type=camera.video_orientation_type,
    )
    ensure_clip_is_archived_task.delay(task_data.json())
    archive_thumbnails_task.delay(task_data.json())
    return archive.id


@archive_router.get("/user_archives")
async def retrieve_user_archives(
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    secrets: BackendSecrets = Depends(get_backend_secrets),
    aws_region: str = Depends(get_aws_region),
) -> list[ArchiveResponse]:
    async with db.tenant_session() as session:
        archives = await get_user_archives(
            valid_clips_only=True, session=session, user_email=app_user.user_email
        )
        clip_ids = [clip.clip_id for archive in archives for clip in archive.clips]
        preview_thumbnails = (
            await orm.ArchivedThumbnail.get_archived_thumbnails_preview(
                session, clip_ids
            )
        )
    sign_thumbnails(
        thumbnails=[
            thumbnail
            for thumbnail in preview_thumbnails.values()
            if thumbnail is not None
        ],
        aws_credentials=secrets.aws_credentials(),
        aws_region=aws_region,
    )

    for archive in archives:
        clips_preview_thumbnails: dict[int, ThumbnailResponse] = {}
        for clip in archive.clips:
            if clip_thumbnail := preview_thumbnails.get(clip.clip_id):
                clips_preview_thumbnails[clip.clip_id] = ThumbnailResponse(
                    s3_path=clip_thumbnail.s3_path,
                    s3_signed_url=clip_thumbnail.s3_signed_url,
                    timestamp=clip.clip.start_time,
                )
        archive.clips_preview_thumbnails = clips_preview_thumbnails

    return archives


@archive_router.get("/summary")
async def summary(
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
) -> list[ArchiveSummaryResponse]:
    async with db.tenant_session() as session:
        archives = await get_user_archives(
            session, user_email=app_user.user_email, valid_clips_only=True
        )
    return [
        ArchiveSummaryResponse(
            id=archive.id, title=archive.title, description=archive.description
        )
        for archive in archives
    ]


@archive_router.post("/add_clip/{archive_id}")
async def add_clip_to_existing_archive(
    archive_clip_request: ArchiveAddClipRequest,
    archive_id: int,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    boto_session_maker: BotoSessionFn = Depends(get_boto_session_maker),
    iot_data_client: BotoIotDataClient = Depends(get_iot_data_client),
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    envs: BackendEnvs = Depends(get_backend_envs),
    value_store: ValueStore = Depends(get_value_store),
    master_playlist_replace_url: URL = Depends(get_replaced_master_playlist_url),
    _access_logger: None = Depends(
        AccessLogger(
            UserActions.ADDED_CLIP_TO_EXISTING_ARCHIVE,
            ["start_time", "end_time", "mac_address", "comment"],
        )
    ),
) -> None:
    creation_time = AwareDatetime.utcnow()
    async with db.tenant_session() as session:
        camera = await get_camera_from_mac_address_or_fail(
            session, access, archive_clip_request.archive_clip.mac_address
        )
        clip_data_row = await orm.orm_clip_data.ClipData.create_or_retrieve_clip_data(
            session,
            ClipDataCreate(
                mac_address=archive_clip_request.archive_clip.mac_address,
                start_time=archive_clip_request.archive_clip.start_time,
                end_time=archive_clip_request.archive_clip.end_time,
                creation_time=creation_time,
            ),
        )
        try:
            await orm.Archive.add_clip_to_archive(
                session,
                archive_id=archive_id,
                clip_data=clip_data_row,
                user_email=app_user.user_email,
            )
        except ArchiveError as ex:
            raise HTTPException(status_code=400, detail=f"Failed to add clip: {ex}")
        await session.flush()
        clip_data = ClipData.from_orm(clip_data_row)

    try:
        await archive_request_kvs_if_not_exists(
            camera=camera,
            clip_data=clip_data,
            kinesis_stream_request=KinesisStreamCreationRequest(
                retention_duration=get_archive_retention(envs.environment_name)
            ),
            boto_session_maker=boto_session_maker,
            iot_data_client=iot_data_client,
            mq_connection=mq_connection,
            db=db,
            value_store=value_store,
            master_playlist_redirect_url=master_playlist_replace_url,
            tenant=app_user.tenant,
            use_iot_core=await is_iot_core_feature_enabled(
                db, IOTCoreFeature.VIDEO, app_user.tenant
            ),
        )
    except KinesisError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating kinesis stream: {e}",
        ) from e

    async with db.tenant_session() as session:
        await orm.ArchiveComment.create_comment(
            session,
            archive_id,
            app_user.user_email,
            archive_clip_request.comment or "",
            creation_time=creation_time,
        )

    if clip_data.s3_path is not None:
        return

    task_data = ClipArchiveRequest(
        mac_address=clip_data.mac_address,
        nvr_uuid=camera.nvr_uuid,
        clip_id=clip_data.id,
        start_time=clip_data.start_time,
        end_time=clip_data.end_time,
        tenant=app_user.tenant,
        video_orientation_type=camera.video_orientation_type,
    )
    ensure_clip_is_archived_task.delay(task_data.json())
    archive_thumbnails_task.delay(task_data.json())


@archive_router.post("/share")
async def share_archive(
    share_request: ShareArchiveRequest,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    email_client: EmailClient = Depends(get_email_client),
    _access_logger: None = Depends(
        AccessLogger(UserActions.SHARED_AN_ARCHIVE, ["emails"])
    ),
) -> None:
    try:
        async with db.tenant_session() as session:
            for email in share_request.emails:
                is_admin = app_user.role == auth.UserRole.ADMIN
                await orm.SharedArchive.share_archive(
                    session,
                    shared_archive_metadata=SharedArchiveCreate(
                        archive_id=share_request.archive_id, user_email=email
                    ),
                    user_email=app_user.user_email,
                    skip_owner_check=is_admin,
                )
    except ArchiveError as ex:
        raise HTTPException(status_code=400, detail=f"Failed to share archive: {ex}")

    for email in share_request.emails:
        await send_shared_archive_email(
            email_client=email_client,
            recipient=email,
            content=format_shared_archive_message(sender=share_request.sender_email),
        )


@archive_router.post("/unshare/{archive_id}")
async def unshare_archive(
    archive_id: int,
    email: EmailStr = Body(embed=True),
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    _access_logger: None = Depends(
        AccessLogger(UserActions.UNSHARED_AN_ARCHIVE, ["email"])
    ),
) -> None:
    try:
        async with db.tenant_session() as session:
            await orm.SharedArchive.unshare_archive(
                session,
                SharedArchiveCreate(archive_id=archive_id, user_email=email),
                app_user.user_email,
            )
    except ArchiveError as ex:
        raise HTTPException(status_code=400, detail=f"Failed to share archive: {ex}")


@archive_router.delete("/{archive_id}")
async def delete_archive(
    archive_id: int,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    _access_logger: None = Depends(
        AccessLogger(user_action=UserActions.DELETED_AN_ARCHIVE)
    ),
) -> None:
    # TODO(@lberg): this is not cleaning after itself, we should delete the clip data
    # and thumbnails as well, from both DB and S3/ kinensis
    # https://orcamobilityai.atlassian.net/browse/VAS-2987
    async with db.tenant_session() as session:
        try:
            await orm.Archive.delete_archive(session, archive_id, app_user.user_email)
        except ArchiveError as ex:
            raise HTTPException(
                status_code=400, detail=f"Failed to delete archive: {ex}"
            )


@archive_router.post("/update_description/{archive_id}")
async def update_archive_description(
    archive_id: int,
    description: str = Body(embed=True),
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    _access_logger: None = Depends(
        AccessLogger(UserActions.UPDATED_ARCHIVE_DESCRIPTION, ["description"])
    ),
) -> None:
    async with db.tenant_session() as session:
        try:
            if app_user.role == auth.UserRole.ADMIN:
                # Admins can update any archive description for its organization
                await orm.Archive.admin_only_update_archive_description(
                    session, archive_id, description
                )
            else:
                # Non-admins can only update their own archive descriptions
                await orm.Archive.update_archive_description(
                    session, archive_id, description, app_user.user_email
                )
        except ArchiveError as ex:
            raise HTTPException(
                status_code=400, detail=f"Failed to update archive: {ex}"
            )


@archive_router.post("/update_title/{archive_id}")
async def update_archive_title(
    archive_id: int,
    title: str = Body(embed=True, min_length=1),
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.UPDATED_ARCHIVE_TITLE, ["archive_id", "title"])
    ),
) -> None:
    async with db.tenant_session() as session:
        try:
            if app_user.role == auth.UserRole.ADMIN:
                # Admins can update any archive title for its organization
                await orm.Archive.admin_only_update_archive_title(
                    session, archive_id, title
                )
            else:
                # Non-admins can only update their own archive titles
                await orm.Archive.update_archive_title(
                    session, archive_id, title, app_user.user_email
                )
        except ArchiveError as ex:
            raise HTTPException(
                status_code=400, detail=f"Failed to update archive: {ex}"
            )


@archive_router.post("/clip")
async def retrieve_archive_clip_url(
    archive_clip_request: KinesisArchivedVideoClipRequest,
    boto_session_maker: BotoSessionFn = Depends(get_boto_session_maker),
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    value_store: ValueStore = Depends(get_value_store),
    playlist_replace_url: URL = Depends(get_replaced_master_playlist_url),
) -> AnyHttpUrl:
    """Get a kinesis url for an archived clip in the past."""
    async with db.tenant_session() as session:
        await check_user_can_access_archive_clip(
            session,
            app_user.user_email,
            archive_clip_request.archive_id,
            archive_clip_request.clip_id,
        )
        clip_data_orm = await orm.orm_clip_data.ClipData.get_clip_data_by_id(
            session, archive_clip_request.clip_id
        )
        clip_data = ClipData.from_orm(clip_data_orm)

    if clip_data.kvs_stream_name is None:
        raise HTTPException(
            status_code=400, detail="Clip data does not have a kvs stream name."
        )

    try:
        return await get_kinesis_clip_url(
            master_playlist_redirect_url=playlist_replace_url,
            clip_params=ArchiveClipParams(
                start_time=clip_data.start_time,
                end_time=clip_data.end_time,
                upload_stream_name=clip_data.kvs_stream_name,
            ),
            boto_session_maker=boto_session_maker,
            value_store=value_store,
        )
    except KinesisError as e:
        logger.error(f"Archive request kinesis stream failed. {e}")
        raise HTTPException(
            status_code=400, detail="Archive request kinesis stream failed."
        ) from e


@archive_router.get("/{archive_id}/comments")
async def retrieve_archive_comments(
    archive_id: int,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
) -> list[ArchiveCommentResponse]:
    """Endpoint to retrieve all comments for a archive"""
    async with db.tenant_session() as session:
        await check_user_can_access_archive(session, app_user.user_email, archive_id)
        comments = await orm.ArchiveComment.get_archive_comments(session, archive_id)
        clips = await orm.ArchiveClipData.get_archive_clip_data(session, archive_id)

    return retrieve_comment_responses(comments, clips)


@archive_router.post("/comment")
async def add_comment(
    add_comment_request: ArchiveCommentRequest,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.ADDED_ARCHIVE_COMMENT, ["archive_id", "comment"])
    ),
) -> None:
    """Endpoint to add a new comment to a archive"""
    async with db.tenant_session() as session:
        await check_user_can_access_archive(
            session, app_user.user_email, add_comment_request.archive_id
        )

        await orm.ArchiveComment.create_comment(
            session,
            add_comment_request.archive_id,
            app_user.user_email,
            add_comment_request.comment,
            creation_time=AwareDatetime.utcnow(),
        )


@archive_router.get("/{archive_id}/clip/{clip_id}/thumbnails")
async def retrieve_archive_clip_thumbnails(
    archive_id: int,
    clip_id: int,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    secrets: BackendSecrets = Depends(get_backend_secrets),
    aws_region: str = Depends(get_aws_region),
) -> list[ThumbnailResponse]:
    """Endpoint to retrieve all thumbnails for a clip"""
    async with db.tenant_session() as session:
        await check_user_can_access_archive_clip(
            session, app_user.user_email, archive_id, clip_id
        )
        try:
            thumbnails = await orm.ArchivedThumbnail.get_archived_thumbnails(
                session, clip_id
            )
        except ArchivedThumbnailsNotFound:
            logger.error(
                f"No archived thumbnails found for {clip_id=}: it might still be"
                " uploading."
            )
            return []
    sign_thumbnails(
        thumbnails=[thumbnail for thumbnail in thumbnails if thumbnail is not None],
        aws_credentials=secrets.aws_credentials(),
        aws_region=aws_region,
    )

    return [
        ThumbnailResponse(
            s3_path=thumbnail.s3_path,
            s3_signed_url=thumbnail.s3_signed_url,
            timestamp=thumbnail.timestamp,
        )
        for thumbnail in thumbnails
        if thumbnail is not None and thumbnail.s3_signed_url is not None
    ]


@archive_router.post("/{archive_id}/tags")
async def set_archive_tags(
    archive_id: int,
    request: SetArchiveTagsRequest,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.SET_ARCHIVE_TAGS, ["archive_id", "tag_ids"])
    ),
) -> None:
    async with db.tenant_session() as session:
        is_admin = app_user.role == auth.UserRole.ADMIN
        if not is_admin and not await orm.Archive.user_owns_archive(
            session, archive_id, app_user.user_email
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Archive with {archive_id=} does not exist "
                    "or user has no access to it"
                ),
            )

        await orm.ArchiveTag.set_archive_tags(session, archive_id, request.tag_ids)
