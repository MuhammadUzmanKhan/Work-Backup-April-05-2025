import base64
from typing import Any, Type

import sentry_sdk

from backend.access_control import http_client_utils as http_client
from backend.access_control.brivo import models
from backend.utils import AwareDatetime


class BrivoClient:
    def __init__(self, client_id: str, client_secret: str) -> None:
        self.client_id = client_id
        self.client_secret = client_secret

    async def authorise(
        self, authorization_code: str
    ) -> models.BrivoAuthorisationResponse:
        credentials = self.client_id + ":" + self.client_secret
        encoded_credentials = base64.b64encode(credentials.encode("ascii")).decode(
            "ascii"
        )

        try:
            response = await http_client.send_http_request(
                method=http_client.HTTPMethods.HTTP_POST,
                endpoint="https://auth.brivo.com/oauth/token",
                headers={"Authorization": "Basic " + encoded_credentials},
                data={"grant_type": "authorization_code", "code": authorization_code},
                response_class=models.BrivoAuthorisationResponse,
            )
        except http_client.SendHTTPRequestError as e:
            raise models.BrivoError(f"Error while calling Brivo API: {e}")

        if response is None:
            raise models.BrivoError("Brivo response is empty")

        return response

    async def refresh_access_token(
        self, refresh_token: str
    ) -> models.BrivoAuthorisationResponse:
        credentials = self.client_id + ":" + self.client_secret
        encoded_credentials = base64.b64encode(credentials.encode("ascii")).decode(
            "ascii"
        )

        try:
            response = await http_client.send_http_request(
                method=http_client.HTTPMethods.HTTP_POST,
                endpoint="https://auth.brivo.com/oauth/token",
                headers={"Authorization": "Basic " + encoded_credentials},
                data={"grant_type": "refresh_token", "refresh_token": refresh_token},
                response_class=models.BrivoAuthorisationResponse,
            )
        except http_client.SendHTTPRequestError as e:
            raise models.BrivoError(f"Error while calling Brivo API: {e}")

        if response is None:
            raise models.BrivoError("Brivo response is empty")

        return response

    @staticmethod
    async def _send_request(
        method: http_client.HTTPMethods,
        api: str,
        auth_data: models.BrivoAuthorisationData,
        params: dict[str, Any] = {},
        json: dict[str, Any] | list[dict[str, Any]] = {},
        response_class: Type[http_client.TBaseModel] | None = None,
    ) -> http_client.TBaseModel | None:
        if auth_data.api_key is None or auth_data.access_token is None:
            raise models.BrivoError(
                "Brivo Auth Data is missing api key or access token"
            )

        endpoint = "https://api.brivo.com/v1/api/" + api
        headers = {
            "Authorization": "bearer " + auth_data.access_token,
            "api-key": auth_data.api_key,
        }
        sentry_sdk.set_context(
            "Brivo API request",
            {"endpoint": endpoint, "headers": headers, "params": params},
        )

        try:
            return await http_client.send_http_request(
                method=method,
                endpoint=endpoint,
                headers=headers,
                params=params,
                json=json,
                response_class=response_class,
            )
        except http_client.SendHTTPRequestError as e:
            raise models.BrivoError(f"Error while calling Brivo API: {e}")

    @staticmethod
    async def list_access_points(
        auth_data: models.BrivoAuthorisationData,
    ) -> list[models.BrivoAccessPoint]:
        """
        List all access points in Brivo.
        https://apidocs.brivo.com/#api-Access_Point-ListAccessPoints
        """

        response = await BrivoClient._send_request(
            method=http_client.HTTPMethods.HTTP_GET,
            api="access-points",
            auth_data=auth_data,
            response_class=models.BrivoAccessPoints,
        )
        if response is None:
            raise models.BrivoError("Brivo response is empty")

        return response.data

    @staticmethod
    async def list_events(
        auth_data: models.BrivoAuthorisationData,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
    ) -> list[models.BrivoEvent]:
        """
        List all access events between start_time and end_time.
        https://apidocs.brivo.com/#api-Events-ListAccessEvent
        """

        response = await BrivoClient._send_request(
            method=http_client.HTTPMethods.HTTP_GET,
            api="events/access",
            params={
                "filter": (
                    "occurred__gt:"
                    + start_time.isoformat()
                    + ";occurred__lt:"
                    + end_time.isoformat()
                ),
                "pageSize": 100,
            },
            auth_data=auth_data,
            response_class=models.BrivoEvents,
        )
        if response is None:
            raise models.BrivoError("Brivo response is empty")

        return response.data

    @staticmethod
    async def unlock_access_point(
        auth_data: models.BrivoAuthorisationData, access_point_id: int
    ) -> None:
        """
        Unlock an access point for a Admin User in Brivo.
        https://apidocs.brivo.com/#api-Access_Point-ActivateAccessPoint
        """

        await BrivoClient._send_request(
            method=http_client.HTTPMethods.HTTP_POST,
            api=f"access-points/{access_point_id}/activate",
            auth_data=auth_data,
            response_class=None,
        )
