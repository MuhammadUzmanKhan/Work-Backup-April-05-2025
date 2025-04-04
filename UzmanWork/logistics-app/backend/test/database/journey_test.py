from datetime import timedelta

from backend.database import database, orm
from backend.database.models import (
    VALID_EMBEDDING_DIMS,
    Camera,
    EmbeddingResponseCreate,
    JourneyCameraResult,
    JourneyResponseCreate,
    SearchAreaRectangle,
)
from backend.database.organization_models import Organization
from backend.utils import AwareDatetime


async def _add_journey_request(
    db_instance: database.Database,
    mac_address: str,
    track_id: int,
    perception_stack_start_id: str,
    search_start_time: AwareDatetime,
    search_end_time: AwareDatetime,
    object_time: AwareDatetime,
    tenant: str,
) -> orm.JourneyRequest:
    async with db_instance.tenant_session(tenant=tenant) as session:
        request = await orm.JourneyRequest.add_request(
            session,
            mac_address=mac_address,
            track_id=track_id,
            perception_stack_start_id=perception_stack_start_id,
            search_start_time=search_start_time,
            search_end_time=search_end_time,
            object_time=object_time,
        )
    return request


async def test_add_journey_request(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    # Test adding journey request
    test_track_id = 1
    test_perception_stack_start_id = "test_perception_stack_start_id"
    dummy_timestamp = AwareDatetime.utcnow()
    test_search_start_time = dummy_timestamp + timedelta(seconds=1)
    test_search_end_time = dummy_timestamp + timedelta(seconds=2)
    request = await _add_journey_request(
        db_instance,
        camera.mac_address,
        test_track_id,
        test_perception_stack_start_id,
        test_search_start_time,
        test_search_end_time,
        dummy_timestamp,
        organization.tenant,
    )

    assert request.id == 1
    assert request.mac_address == camera.mac_address
    assert request.track_id == test_track_id
    assert request.perception_stack_start_id == test_perception_stack_start_id
    assert request.search_start_time == test_search_start_time
    assert request.search_end_time == test_search_end_time
    assert request.object_time == dummy_timestamp


async def test_non_empty_embedding(
    db_instance: database.Database,
    camera: Camera,
    rectangle: SearchAreaRectangle,
    organization: Organization,
) -> None:
    await _add_journey_request(
        db_instance,
        camera.mac_address,
        track_id=1,
        perception_stack_start_id="test_perception_stack_start_id",
        search_start_time=AwareDatetime.utcnow(),
        search_end_time=AwareDatetime.utcnow(),
        object_time=AwareDatetime.utcnow(),
        tenant=organization.tenant,
    )

    dummy_embedding = [float(i) for i in range(VALID_EMBEDDING_DIMS[0])]
    dummy_clip_version = "v1.0"
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        instance = await orm.EmbeddingResponse.add_response(
            session,
            EmbeddingResponseCreate(
                request_id=1, embedding=dummy_embedding, clip_version=dummy_clip_version
            ),
        )

    assert instance.request_id == 1
    assert instance.embedding == dummy_embedding  # type: ignore
    assert instance.clip_version == dummy_clip_version

    # Test querying embedding response
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        response = await orm.EmbeddingResponse.query_response(session, 1)

    assert response is not None
    assert response.request_id == 1
    assert response.embedding == dummy_embedding
    assert response.clip_version == dummy_clip_version


async def test_empty_embedding(
    db_instance: database.Database,
    camera: Camera,
    rectangle: SearchAreaRectangle,
    organization: Organization,
) -> None:
    await _add_journey_request(
        db_instance,
        camera.mac_address,
        track_id=1,
        perception_stack_start_id="test_perception_stack_start_id",
        search_start_time=AwareDatetime.utcnow(),
        search_end_time=AwareDatetime.utcnow(),
        object_time=AwareDatetime.utcnow(),
        tenant=organization.tenant,
    )

    # Test adding journey response
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        instance = await orm.EmbeddingResponse.add_response(
            session,
            EmbeddingResponseCreate(request_id=1, embedding=None, clip_version=None),
        )

    assert instance.request_id == 1
    assert instance.embedding is None
    assert instance.clip_version is None

    # Test querying embedding response
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        response = await orm.EmbeddingResponse.query_response(session, 1)

    assert response is not None
    assert response.request_id == 1
    assert response.embedding is None
    assert response.clip_version is None


async def test_no_embedding_response(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        response = await orm.EmbeddingResponse.query_response(session, 1)

    assert response is None


async def test_journey_response(
    db_instance: database.Database,
    camera: Camera,
    rectangle: SearchAreaRectangle,
    organization: Organization,
) -> None:
    await _add_journey_request(
        db_instance,
        camera.mac_address,
        track_id=1,
        perception_stack_start_id="test_perception_stack_start_id",
        search_start_time=AwareDatetime.utcnow(),
        search_end_time=AwareDatetime.utcnow(),
        object_time=AwareDatetime.utcnow(),
        tenant=organization.tenant,
    )

    dummy_nvr_uuid = "dummy_uuid"
    dummy_mac_addresses = ["dummy_mac1", "dummy_mac2"]
    dummy_timestamps = [
        AwareDatetime.utcnow(),
        AwareDatetime.utcnow() + timedelta(seconds=1),
    ]
    dummy_object_indices = [1, 2]
    dummy_scores = [0.1, 0.2]
    dummy_camera_results = []
    for mac_address, timestamp, object_idx, score in zip(
        dummy_mac_addresses, dummy_timestamps, dummy_object_indices, dummy_scores
    ):
        dummy_camera_results.append(
            JourneyCameraResult(
                mac_address=mac_address,
                timestamp=timestamp,
                object_index=object_idx,
                score=score,
            )
        )
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.JourneyResponse.add_response_batch(
            session,
            response_create=JourneyResponseCreate(
                request_id=1,
                nvr_uuid=dummy_nvr_uuid,
                camera_results=dummy_camera_results,
            ),
        )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        responses = await orm.JourneyResponse.query_response(
            session, request_id=1, min_score=0.0
        )
        # sort by timestamp
        responses = sorted(responses, key=lambda x: x.timestamp)

    assert [r.timestamp for r in responses] == dummy_timestamps
    assert [r.mac_address for r in responses] == dummy_mac_addresses
    assert [r.object_idx for r in responses] == dummy_object_indices
