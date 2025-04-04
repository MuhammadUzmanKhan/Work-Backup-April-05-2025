import logging
import pathlib

import aio_pika
import boto3
import fastapi
import jwt
import stamina
from aiobotocore.credentials import AioCredentials
from fastapi.datastructures import URL

from backend import logging_config
from backend.access_control.alta.client import AltaClient
from backend.access_control.brivo.client import BrivoClient
from backend.auth0_api import Auth0API, Authenticator
from backend.auth_models import AwsCognitoClient
from backend.boto_utils import BotoAioSession, BotoIotDataClient, BotoSessionFn
from backend.constants import (
    MIGRATION_WAIT_TIME_S,
    REPLACE_MASTER_PLAYLIST_ENDPOINT_NAME,
    REPLACE_MEDIA_PLAYLIST_ENDPOINT_NAME,
)
from backend.database import database, orm
from backend.database.database import Database, DatabaseConnectionConfig
from backend.email_sending import EmailClient
from backend.envs import BackendEnvs, BackendSecrets
from backend.llm import LargeLanguageModel
from backend.slack_client import SlackClient
from backend.sms_sending import SMSClient
from backend.value_store import ValueStore

backend_secrets: BackendSecrets | None = None
backend_envs: BackendEnvs | None = None
database_instance: Database | None = None
email_client: EmailClient | None = None
slack_client: SlackClient | None = None
sms_client: SMSClient | None = None
jwk_client: jwt.PyJWKClient | None = None
mq_connection: aio_pika.abc.AbstractRobustConnection | None = None
auth_api: Auth0API | None = None
value_store: ValueStore | None = None
llm: LargeLanguageModel | None = None
brivo_client: BrivoClient | None = None
alta_client: AltaClient | None = None
aws_cognito_client: AwsCognitoClient | None = None
iot_data_client: BotoIotDataClient | None = None
boto_aio_session: BotoAioSession | None = None

logger = logging.getLogger(logging_config.LOGGER_NAME)

# How many retries between declaring we can't connect to mq
MQ_RETRY_TIMEOUT = 30

AWS_REGION = "us-west-2"


class UninitialisedDependencyError(Exception):
    pass


def init_backend_secrets() -> BackendSecrets:
    global backend_secrets
    if backend_secrets is not None:
        return backend_secrets
    backend_secrets = BackendSecrets()
    return backend_secrets


def init_backend_envs() -> BackendEnvs:
    global backend_envs
    if backend_envs is not None:
        return backend_envs
    backend_envs = BackendEnvs()
    return backend_envs


def init_backend_database(
    secrets: BackendSecrets, application_name: str, debug_sessions_enabled: bool = False
) -> Database:
    global database_instance
    connection_config = DatabaseConnectionConfig(
        user=secrets.postgres_user,
        password=secrets.postgres_pwd,
        database=secrets.postgres_db,
        host=secrets.postgres_host,
        port=secrets.postgres_port,
    )
    database_instance = Database(
        connection_config,
        debug_sessions_enabled=debug_sessions_enabled,
        application_name=application_name,
    )
    return database_instance


def init_email_client(api_key: str | None) -> EmailClient:
    if api_key is None:
        raise UninitialisedDependencyError
    global email_client
    email_client = EmailClient(api_key)
    return email_client


def init_sms_client(
    account_sid: str | None, auth_token: str | None, from_number: str | None
) -> SMSClient:
    if account_sid is None or auth_token is None or from_number is None:
        raise UninitialisedDependencyError
    global sms_client
    sms_client = SMSClient(account_sid, auth_token, from_number)
    return sms_client


def init_slack_client(
    error_alert_slack_channel: str,
    warning_alert_slack_channel: str,
    info_alert_slack_channel: str,
    slack_app_id: str | None,
    slack_app_token: str | None,
) -> SlackClient:
    if slack_app_id is None or slack_app_token is None:
        raise UninitialisedDependencyError

    global slack_client
    slack_client = SlackClient(
        error_alert_slack_channel,
        warning_alert_slack_channel,
        info_alert_slack_channel,
        slack_app_id,
        slack_app_token,
    )
    return slack_client


def init_jwk_client(jwk_url: str) -> None:
    global jwk_client
    jwk_client = jwt.PyJWKClient(jwk_url)


def init_llm() -> None:
    global llm
    try:
        llm = LargeLanguageModel()
    except Exception as exc:
        logger.warning(f"Failed to initialize LargeLanguageModel: {exc}")


def init_brivo_client(client_id: str, client_secret: str) -> BrivoClient:
    global brivo_client
    brivo_client = BrivoClient(client_id=client_id, client_secret=client_secret)
    return brivo_client


def init_alta_client() -> AltaClient:
    global alta_client
    alta_client = AltaClient()
    return alta_client


def get_brivo_client() -> BrivoClient:
    if brivo_client is None:
        raise UninitialisedDependencyError
    return brivo_client


def get_alta_client() -> AltaClient:
    if alta_client is None:
        raise UninitialisedDependencyError
    return alta_client


def get_backend_database() -> Database:
    if database_instance is None:
        raise UninitialisedDependencyError
    return database_instance


def get_backend_secrets() -> BackendSecrets:
    if backend_secrets is None:
        return init_backend_secrets()
    return backend_secrets


def get_backend_envs() -> BackendEnvs:
    if backend_envs is None:
        return init_backend_envs()
    return backend_envs


def get_email_client() -> EmailClient:
    if email_client is None:
        raise UninitialisedDependencyError
    return email_client


def get_slack_client() -> SlackClient:
    if slack_client is None:
        raise UninitialisedDependencyError
    return slack_client


def get_sms_client() -> SMSClient:
    if sms_client is None:
        raise UninitialisedDependencyError
    return sms_client


def get_jwk_client() -> jwt.PyJWKClient:
    if jwk_client is None:
        raise UninitialisedDependencyError
    return jwk_client


def get_aws_region() -> str:
    return AWS_REGION


def get_boto_session_maker() -> BotoSessionFn:
    def get_boto_session() -> boto3.Session:
        secrets: BackendSecrets = get_backend_secrets()
        return boto3.Session(
            aws_access_key_id=secrets.aws_server_public_key,
            aws_secret_access_key=secrets.aws_server_secret_key,
            aws_session_token=secrets.aws_server_session_token,
            region_name=get_aws_region(),
        )

    return get_boto_session


async def init_iot_data_client() -> BotoIotDataClient:
    global iot_data_client
    aio_session = get_boto_aio_session()
    iot_data_client = await aio_session.get_iot_client()
    return iot_data_client


def get_iot_data_client() -> BotoIotDataClient:
    if iot_data_client is None:
        raise UninitialisedDependencyError("Iot data client not initialized")
    return iot_data_client


def init_boto_aio_session() -> BotoAioSession:
    global boto_aio_session
    secrets: BackendSecrets = get_backend_secrets()
    boto_aio_session = BotoAioSession(
        credentials=AioCredentials(
            access_key=secrets.aws_server_public_key,
            secret_key=secrets.aws_server_secret_key,
            token=secrets.aws_server_session_token,
        ),
        aws_region=get_aws_region(),
    )
    return boto_aio_session


def get_boto_aio_session() -> BotoAioSession:
    if boto_aio_session is None:
        raise UninitialisedDependencyError("Boto aio session not initialized")
    return boto_aio_session


@stamina.retry(on=ConnectionError, timeout=MQ_RETRY_TIMEOUT)
async def init_mq_connection(mq_address: str) -> aio_pika.abc.AbstractRobustConnection:
    global mq_connection
    mq_connection = await aio_pika.connect_robust(mq_address)
    return mq_connection


def get_mq_connection() -> aio_pika.abc.AbstractRobustConnection:
    if mq_connection is None:
        raise UninitialisedDependencyError("MQ connection not initialized")
    return mq_connection


def init_aws_cognito_client(
    jwk_client: jwt.PyJWKClient,
    boto_session_fn: BotoSessionFn,
    value_store: ValueStore,
    aws_cognito_pool_id: str,
    aws_cognito_scope: str,
) -> AwsCognitoClient:
    global aws_cognito_client

    aws_cognito_client = AwsCognitoClient(
        jwk_client=jwk_client,
        boto_session_fn=boto_session_fn,
        value_store=value_store,
        aws_cognito_pool_id=aws_cognito_pool_id,
        scope=aws_cognito_scope,
    )
    return aws_cognito_client


def get_aws_cognito_client() -> AwsCognitoClient:
    if aws_cognito_client is None:
        raise UninitialisedDependencyError
    return aws_cognito_client


def init_auth_api(
    *,
    auth0_domain: str,
    auth0_client_id: str,
    auth0_client_secret: str,
    audience: str,
    token_cache_path: pathlib.Path,
    organizations_key: str,
    role_key: str,
    access_restrictions_key: str,
) -> None:
    global auth_api
    authenticator = Authenticator(
        auth_url=auth0_domain,
        client_id=auth0_client_id,
        client_secret=auth0_client_secret,
        audience=audience,
        token_cache_path=token_cache_path,
    )
    auth_api = Auth0API(
        authenticator=authenticator,
        organizations_key=organizations_key,
        role_key=role_key,
        access_restrictions_key=access_restrictions_key,
    )


def get_auth_api() -> Auth0API:
    if auth_api is None:
        raise UninitialisedDependencyError("Auth client not initialized")
    return auth_api


def init_value_store(redis_host: str, redis_port: int) -> ValueStore:
    global value_store
    value_store = ValueStore(redis_host, redis_port)
    return value_store


def get_value_store() -> ValueStore:
    if value_store is None:
        raise UninitialisedDependencyError("Redis client not initialized")
    return value_store


def get_llm() -> LargeLanguageModel:
    if llm is None:
        raise UninitialisedDependencyError("Large language model not initialized")
    return llm


def init_app(app: fastapi.FastAPI) -> None:
    envs = get_backend_envs()
    if envs.docs_disabled:
        app.openapi_url = None
        app.docs_url = None
        app.redoc_url = None


async def initialize_dependencies() -> None:
    envs = init_backend_envs()
    secrets = init_backend_secrets()
    init_backend_database(
        secrets,
        debug_sessions_enabled=envs.debug_database_sessions_enabled,
        application_name=envs.api_target,
    )
    await init_mq_connection(envs.mq_address)
    init_email_client(secrets.sendgrid_api_key)
    init_slack_client(
        envs.error_alert_slack_channel,
        envs.warning_alert_slack_channel,
        envs.info_alert_slack_channel,
        secrets.slack_app_id,
        secrets.slack_app_token,
    )
    init_sms_client(
        secrets.sms_account_sid, secrets.sms_auth_token, secrets.sms_from_number
    )
    init_jwk_client(envs.auth0_jwk_url)
    init_auth_api(
        auth0_domain=envs.auth0_domain,
        auth0_client_id=secrets.auth0_client_id,
        auth0_client_secret=secrets.auth0_client_secret,
        audience=envs.auth0_auth_api_audience,
        token_cache_path=envs.auth0_token_cache_path,
        organizations_key=envs.auth0_jwt_org_key,
        role_key=envs.auth0_jwt_role_key,
        access_restrictions_key=envs.auth0_jwt_access_restrictions_key,
    )
    value_store = init_value_store(envs.redis_host, envs.redis_port)
    init_llm()
    init_brivo_client(
        client_id=secrets.brivo_client_id, client_secret=secrets.brivo_client_secret
    )
    init_alta_client()

    init_aws_cognito_client(
        jwk_client=jwt.PyJWKClient(
            "https://cognito-idp.{}.amazonaws.com/{}/.well-known/jwks.json".format(
                AWS_REGION, envs.aws_cognito_pool_id
            )
        ),
        boto_session_fn=get_boto_session_maker(),
        value_store=value_store,
        aws_cognito_pool_id=envs.aws_cognito_pool_id,
        aws_cognito_scope=envs.aws_cognito_scope,
    )

    init_boto_aio_session()
    await init_iot_data_client()


async def populate_database_tables(
    db: database.Database, enable_all_features: bool
) -> None:
    async with db.session() as session:
        await orm.Feature.system_populate_features(session, enable_all_features)


class MigrationTimeout(Exception):
    pass


@stamina.retry(on=MigrationTimeout, timeout=MIGRATION_WAIT_TIME_S)
async def wait_for_migrations(db: database.Database) -> None:
    if not await db.is_at_head_migration():
        raise MigrationTimeout("Migration did not complete in time")


def get_replaced_master_playlist_url(
    request: fastapi.Request, envs: BackendEnvs = fastapi.Depends(get_backend_envs)
) -> URL:
    app: fastapi.FastAPI = request.app
    route_url = app.url_path_for(REPLACE_MASTER_PLAYLIST_ENDPOINT_NAME)
    return URL(f"{str(envs.backend_url).strip('/')}{route_url}")


def get_replaced_media_playlist_url(
    request: fastapi.Request, envs: BackendEnvs = fastapi.Depends(get_backend_envs)
) -> URL:
    app: fastapi.FastAPI = request.app
    route_url = app.url_path_for(REPLACE_MEDIA_PLAYLIST_ENDPOINT_NAME)
    return URL(f"{str(envs.backend_url).strip('/')}{route_url}")


def get_replaced_master_playlist_url_from_router(
    router: fastapi.APIRouter, envs: BackendEnvs
) -> URL:
    route_url = router.url_path_for(REPLACE_MASTER_PLAYLIST_ENDPOINT_NAME)
    return URL(f"{str(envs.backend_url).strip('/')}{route_url}")
