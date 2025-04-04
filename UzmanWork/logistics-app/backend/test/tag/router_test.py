from fastapi import status
from httpx import AsyncClient

from backend.database import tag_models as tag_db_models
from backend.tag import models
from backend.test.client_request import send_get_request, send_post_request


async def test_get_tags(tag_client: AsyncClient, tag: tag_db_models.Tag) -> None:
    response = await send_get_request(tag_client, endpoint="/")
    retrieved_tags = [models.TagResponse.parse_obj(tag) for tag in response.json()]

    assert len(retrieved_tags) == 1
    assert retrieved_tags[0].id == tag.id
    assert retrieved_tags[0].name == tag.name


async def test_create_tag(tag_client: AsyncClient) -> None:
    tag_name = "Test Tag 2"
    await send_post_request(
        tag_client, endpoint="/", request=models.CreateTagRequest(name=tag_name)
    )
    get_response = await send_get_request(tag_client, endpoint="/")
    retrieved_tags = [models.TagResponse.parse_obj(tag) for tag in get_response.json()]

    assert len(retrieved_tags) == 1
    assert retrieved_tags[0].id is not None
    assert retrieved_tags[0].name == tag_name


async def test_create_tag_with_invalid_name(tag_client: AsyncClient) -> None:
    tag_name = "T"
    await send_post_request(
        tag_client,
        endpoint="/",
        request={"name": tag_name},
        expected_status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    )


async def test_create_tag_with_duplicate_name(tag_client: AsyncClient) -> None:
    tag_name = "Test Tag"
    await send_post_request(
        tag_client, endpoint="/", request=models.CreateTagRequest(name=tag_name)
    )

    await send_post_request(
        tag_client,
        endpoint="/",
        request=models.CreateTagRequest(name=tag_name),
        expected_status_code=status.HTTP_409_CONFLICT,
    )
