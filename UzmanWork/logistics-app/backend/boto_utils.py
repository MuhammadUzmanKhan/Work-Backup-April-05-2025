from enum import Enum
from typing import Callable, Protocol, cast

import boto3
from aiobotocore.credentials import AioCredentials
from aiobotocore.session import get_session
from botocore.client import Config

CLIENT_MAX_POOL_CONNECTIONS = 100

BotoSessionFn = Callable[[], boto3.Session]


class BotoIotDataClient(Protocol):
    async def publish(self, topic: str, payload: str) -> None: ...


class BotoClientsIds(Enum):
    IOT_DATA = "iot-data"
    S3 = "s3"
    KINESIS_VIDEO = "kinesisvideo"
    COGNITO_IDP = "cognito-idp"


class BotoAioSession:
    def __init__(self, credentials: AioCredentials, aws_region: str) -> None:
        self.credentials = credentials
        self.aws_region = aws_region
        self.session = get_session()

    async def get_iot_client(self) -> BotoIotDataClient:
        client_config = Config(max_pool_connections=CLIENT_MAX_POOL_CONNECTIONS)
        context = self.session.create_client(
            BotoClientsIds.IOT_DATA.value,
            region_name=self.aws_region,
            aws_secret_access_key=self.credentials.secret_key,
            aws_access_key_id=self.credentials.access_key,
            aws_session_token=self.credentials.token,
            config=client_config,
        )
        # NOTE(@lberg): this is because the client is async context manager
        # see https://github.com/aio-libs/aiobotocore/issues/806
        client = await context.__aenter__()
        return cast(BotoIotDataClient, client)
