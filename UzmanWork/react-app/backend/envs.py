import pathlib
from typing import Literal, Optional

from fastapi.datastructures import URL
from pydantic import BaseSettings, Field

from backend.aws_signer.aws_signer_models import AWSCredentials

EnvValue = Literal["dev", "staging", "release", "prod"]


class BackendEnvs(BaseSettings):
    environment_name: EnvValue
    # domain backend and frontend are hosted in
    domain: str
    # additional cors domains that will be enabled
    additional_cors_domains: list[str] = Field(default_factory=list)
    # port the frontend is exposed at (not the frontend internal port)
    frontend_exposed_port: int
    # port the backend is exposed at (not the backend internal port)
    backend_exposed_port: int
    auth0_domain: str
    auth0_jwk_url: str
    auth0_jwt_org_key: str
    auth0_jwt_uuid_key: str
    auth0_jwt_role_key: str
    auth0_jwt_access_restrictions_key: str
    auth0_jwt_issuer: str
    auth0_web_audience: str
    auth0_edge_audience: str
    auth0_auth_api_audience: str
    auth0_token_cache_path: pathlib.Path
    docs_disabled: bool = False
    mq_address: str
    # redis config
    redis_host: str
    redis_port: int
    # Slack integration related fields
    error_alert_slack_channel: str
    warning_alert_slack_channel: str
    info_alert_slack_channel: str
    # Web app url
    web_app_url: str
    debug_database_sessions_enabled: bool = False
    # Sentry
    sentry_api_dsn: str
    # Version
    version: str
    # Enable all features on each restart
    enable_all_features: bool = False
    # aws cognito pool id
    aws_cognito_pool_id: str
    # aws cognito apps scope
    aws_cognito_scope: str
    # target for the api.
    api_target: str = "unknown"
    # control instrumentation middleware
    disable_instrumentation_middleware: bool = False
    devices_managers_emails: list[str] | Literal["ALL"]

    class Config:
        env_file = "./.env"

    @property
    def backend_url(self) -> URL:
        return URL(f"{self.domain}:{self.backend_exposed_port}")


class BackendSecrets(BaseSettings):
    aws_server_public_key: str
    aws_server_secret_key: str
    # AWS session token, this is only specified if we are not using a long-term
    # secret key, but a temporary token that's generated using MFA.
    aws_server_session_token: Optional[str] = None
    # Database secrets
    postgres_db: str
    postgres_user: str
    postgres_pwd: str
    postgres_host: str
    postgres_port: int
    auth0_client_id: str
    auth0_client_secret: str
    sendgrid_api_key: Optional[str] = None
    # SMS account
    sms_account_sid: Optional[str] = None
    sms_auth_token: Optional[str] = None
    sms_from_number: Optional[str] = None
    # Slack integration related fields
    slack_app_id: Optional[str] = None
    slack_app_token: Optional[str] = None
    # OpenAI API key
    openai_api_key: Optional[str] = None
    # LPR API token
    lpr_api_token: Optional[str] = None
    # BRIVO
    brivo_client_id: str
    brivo_client_secret: str

    class Config:
        env_file = "backend/secrets.env"

    def aws_credentials(self) -> AWSCredentials:
        return AWSCredentials(
            access_key=self.aws_server_public_key,
            secret_key=self.aws_server_secret_key,
            token=self.aws_server_session_token,
        )
