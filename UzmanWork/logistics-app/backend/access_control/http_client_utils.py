import enum
from typing import Any, Type, TypeVar

import aiohttp
import sentry_sdk
from pydantic import BaseModel, ValidationError

TBaseModel = TypeVar("TBaseModel", bound=BaseModel)


class SendHTTPRequestError(Exception):
    pass


class HTTPMethods(str, enum.Enum):
    HTTP_GET = "GET"
    HTTP_POST = "POST"
    HTTP_PUT = "PUT"
    HTTP_DELETE = "DELETE"


async def send_http_request(
    method: HTTPMethods,
    endpoint: str,
    headers: dict[str, str] | None = None,
    params: dict[str, Any] | None = None,
    json: dict[str, Any] | list[dict[str, Any]] | None = None,
    data: dict[str, Any] | None = None,
    response_class: Type[TBaseModel] | None = None,
) -> TBaseModel | None:
    sentry_sdk.set_context(
        "Alta API request", {"endpoint": endpoint, "headers": headers, "params": params}
    )

    async with aiohttp.ClientSession() as session:
        try:
            request_args: Any = {"headers": headers, "params": params}
            if method in [HTTPMethods.HTTP_POST, HTTPMethods.HTTP_PUT]:
                request_args["json"] = json
                request_args["data"] = data

            async with session.request(method, endpoint, **request_args) as response:
                response.raise_for_status()

                if response.content_length == 0 or response.status == 204:
                    return None

                response_json = await response.json()
        except aiohttp.ClientError as e:
            raise SendHTTPRequestError(
                f"Error while calling Access Control API {endpoint} {e}"
            )

    sentry_sdk.set_context("Access Control API response", response_json)

    if not response_class:
        return None

    try:
        return response_class.parse_obj(response_json)
    except ValidationError as e:
        raise SendHTTPRequestError(f"Error while parsing response: {e}")
