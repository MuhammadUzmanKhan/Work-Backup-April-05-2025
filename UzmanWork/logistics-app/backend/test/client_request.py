import enum
from typing import Any, Callable

from fastapi import status
from fastapi.encoders import jsonable_encoder
from httpx import AsyncClient, Response


class HTTPMethods(str, enum.Enum):
    HTTP_GET = "GET"
    HTTP_POST = "POST"
    HTTP_PATCH = "PATCH"
    HTTP_PUT = "PUT"
    HTTP_DELETE = "DELETE"


async def send_http_request(
    client: AsyncClient,
    method: HTTPMethods,
    endpoint: str,
    expected_status_code: int = status.HTTP_200_OK,
    request: Any | None = None,
    params: dict[str, Any] | None = None,
) -> Response:
    # Assertion to ensure method is either GET or POST when params are provided
    assert params is None or method in [
        HTTPMethods.HTTP_GET,
        HTTPMethods.HTTP_POST,
    ], "Method must be GET or POST when params are provided."

    request_methods: dict[HTTPMethods, Callable[..., Any]] = {
        HTTPMethods.HTTP_GET: client.get,
        HTTPMethods.HTTP_POST: client.post,
        HTTPMethods.HTTP_PUT: client.put,
        HTTPMethods.HTTP_PATCH: client.patch,
        HTTPMethods.HTTP_DELETE: client.delete,
    }
    request_method = request_methods[method]

    request_kwargs: dict[str, Any] = {}
    if request is not None:
        request_kwargs["json"] = jsonable_encoder(request)
    if params is not None:
        request_kwargs["params"] = params

    response: Response = await request_method(endpoint, **request_kwargs)

    if response.status_code != expected_status_code:
        raise ValueError(
            f"Expected status code: {expected_status_code}, "
            f"but got {response.status_code}, "
            f"error message: {response.text}"
        )

    return response


async def send_post_request(
    client: AsyncClient,
    endpoint: str,
    request: Any,
    expected_status_code: int = status.HTTP_200_OK,
    params: dict[str, Any] | None = None,
) -> Response:
    return await send_http_request(
        client=client,
        method=HTTPMethods.HTTP_POST,
        endpoint=endpoint,
        expected_status_code=expected_status_code,
        request=request,
        params=params,
    )


async def send_get_request(
    client: AsyncClient,
    endpoint: str,
    expected_status_code: int = status.HTTP_200_OK,
    params: dict[str, Any] | None = None,
) -> Response:
    return await send_http_request(
        client=client,
        method=HTTPMethods.HTTP_GET,
        endpoint=endpoint,
        expected_status_code=expected_status_code,
        params=params,
    )


async def send_delete_request(
    client: AsyncClient, endpoint: str, expected_status_code: int = status.HTTP_200_OK
) -> Response:
    return await send_http_request(
        client=client,
        method=HTTPMethods.HTTP_DELETE,
        endpoint=endpoint,
        expected_status_code=expected_status_code,
    )
