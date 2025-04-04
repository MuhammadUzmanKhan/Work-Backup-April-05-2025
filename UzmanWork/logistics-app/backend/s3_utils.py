import datetime
import functools
import hashlib
import hmac
import urllib.parse
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, BinaryIO, Callable, Generator
from urllib.parse import ParseResult, urlparse

from botocore.exceptions import ClientError

from backend.aws_signer.aws_signer_models import AWSCredentials
from backend.boto_utils import BotoSessionFn
from backend.sync_utils import run_async

# See https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html
# for more information on the S3 signing process.

SAFE_CHARS = "-_.~"
HTTP_METHOD = "GET"
PAYLOAD_HASH = "UNSIGNED-PAYLOAD"
EXPIRES_IN = 86400  # 24 hours
SIGN_ALGORITHM = "AWS4-HMAC-SHA256"


@dataclass
class RequestTime:
    # The time of the request.
    request_time: datetime.datetime
    # The date of the request as a string.
    date: str
    # The date and time of the request as a string.
    date_time: str

    @staticmethod
    def from_datetime(request_time: datetime.datetime) -> "RequestTime":
        """Create a RequestTime object from a datetime.

        :param request_time: the datetime to create the RequestTime object from
        :return: the RequestTime object
        """
        request_date = request_time.strftime("%Y%m%d")
        request_datetime = request_time.strftime("%Y%m%dT%H%M%SZ")
        return RequestTime(request_time, request_date, request_datetime)


def _sign(key: bytes, msg: str) -> bytes:
    """Sign a message with a key.

    :param key: the key to sign the message with
    :param msg: the message to sign
    :return: the signed message
    """
    return hmac.new(key, msg.encode(), hashlib.sha256).digest()


@lru_cache(maxsize=100)
def _get_amz_credentials(
    aws_server_public_key: str, request_date: str, aws_region: str
) -> str:
    """Generate the access request string. This specified the AWS server public key,
    the date of the request, the AWS region, and the service.

    :param aws_server_public_key: the public key for the AWS server
    :param request_date: the date of the request
    :param aws_region: the AWS region
    :return: the access request string
    """
    return urllib.parse.quote(
        f"{aws_server_public_key}/{request_date}/{aws_region}/s3/aws4_request",
        safe=SAFE_CHARS,
    )


@lru_cache(maxsize=100)
def _get_date_region_service_key(
    aws_server_secret_key: str, request_date: str, aws_region: str
) -> bytes:
    """Generate the signing key. This is used to sign the the canonical request.

    :param aws_server_secret_key: the secret key for the AWS server
    :param request_date: the date of the request
    :param aws_region: the AWS region
    :return: the signing key
    """
    k_date = _sign(("AWS4" + aws_server_secret_key).encode(), request_date)
    k_region = _sign(k_date, aws_region)
    k_service = _sign(k_region, "s3")
    k_signing = _sign(k_service, "aws4_request")
    return k_signing


@lru_cache(maxsize=100)
def _get_security_token_header(aws_server_session_token: str | None) -> str:
    """Generate the security token header. This is used to authenticate the request
    if the client has a session token.

    :param aws_server_session_token: the session token for the AWS server
    :return: the security token header
    """
    if aws_server_session_token:
        session_token_escaped = urllib.parse.quote(
            aws_server_session_token, safe=SAFE_CHARS
        )
        return f"&X-Amz-Security-Token={session_token_escaped}"
    return ""


def _create_canonical_request(
    resource_key: str,
    aws_server_public_key: str,
    aws_server_session_token: str | None,
    request_time: RequestTime,
    aws_bucket: str,
    aws_region: str,
) -> tuple[str, str]:
    """Create the canonical request. This is the first step in the S3 signing process.
    Returns the canonical request and the canonical query string.

    :param resource_key: the key of the resource to sign
    :param aws_server_public_key: the public key for the AWS server
    :param aws_server_session_token: the session token for the AWS server
    :param request_time: the time of the request
    :param aws_bucket: the AWS bucket
    :param aws_region: the AWS region
    :return: the canonical request and the canonical query as strings
    """
    # Don't escape the forward slash in the key name as per specs.
    canonical_uri = urllib.parse.quote(resource_key, safe=SAFE_CHARS + "/")
    amz_credentials = _get_amz_credentials(
        aws_server_public_key, request_time.date, aws_region
    )
    token_header = _get_security_token_header(aws_server_session_token)

    canonical_query_string = (
        f"X-Amz-Algorithm={SIGN_ALGORITHM}"
        f"&X-Amz-Credential={amz_credentials}&X-Amz-Date={request_time.date_time}"
        f"&X-Amz-Expires={EXPIRES_IN}{token_header}&X-Amz-SignedHeaders=host"
    )
    canonical_headers = f"host:{aws_bucket}.s3.amazonaws.com\n"
    signed_headers = "host"
    canonical_request = (
        f"{HTTP_METHOD}\n{canonical_uri}\n{canonical_query_string}\n"
        f"{canonical_headers}\n{signed_headers}\n{PAYLOAD_HASH}"
    )
    return canonical_request, canonical_query_string


def _create_signature(
    aws_server_secret_key: str,
    canonical_request: str,
    request_time: RequestTime,
    aws_region: str,
) -> str:
    """Create the signature. This is the second step in the S3 signing process.

    :param aws_server_secret_key: the secret key for the AWS server
    :param canonical_request: the canonical request
    :param request_time: the time of the request
    :param aws_region: the AWS region
    :return: the signature for the request as a hex string.
    """

    # NOTE(@lberg): This is similar to the credentials
    # but it doesn't include the public key and it's not url encoded.
    credential_scope = f"{request_time.date}/{aws_region}/s3/aws4_request"
    hashed_canonical_request = hashlib.sha256(canonical_request.encode()).hexdigest()
    to_sign = (
        f"{SIGN_ALGORITHM}\n{request_time.date_time}"
        f"\n{credential_scope}\n{hashed_canonical_request}"
    )
    sign_key = _get_date_region_service_key(
        aws_server_secret_key, request_time.date, aws_region
    )
    return _sign(sign_key, to_sign).hex()


def parse_s3_path(
    s3_path: str, remove_leading_slash_key: bool = False
) -> tuple[str, str]:
    parse_result: ParseResult = urlparse(s3_path)
    if parse_result.scheme != "s3":
        raise ValueError(f"{s3_path=} must start with s3://")

    if parse_result.fragment:
        raise ValueError(f"{s3_path=} cannot have a fragment")

    if parse_result.query:
        raise ValueError(f"{s3_path=} cannot have a query")

    if parse_result.port:
        raise ValueError(f"{s3_path=} cannot have a port")

    if parse_result.username:
        raise ValueError(f"{s3_path=} cannot have a username")

    if parse_result.password:
        raise ValueError(f"{s3_path=} cannot have a password")

    bucket = parse_result.netloc
    key = parse_result.path
    if not bucket or not key:
        raise ValueError(f"Invalid {s3_path=}: {bucket=} and {key=} must be specified")

    if remove_leading_slash_key and key.startswith("/"):
        key = key.removeprefix("/")
    return bucket, key


class S3Path(str):
    @classmethod
    def __get_validators__(cls) -> Generator[Callable[..., Any], None, None]:
        yield cls.validate

    @classmethod
    def validate(cls, v: str) -> "S3Path":
        # This will raise a ValueError if the path is invalid.
        parse_s3_path(v)
        return S3Path(v)

    def bucket_and_key(self, remove_leading_slash_key: bool) -> tuple[str, str]:
        # NOTE(@lberg): this validation is not required but
        # can't be avoid if we inherit from str.
        return parse_s3_path(self, remove_leading_slash_key)


def get_signed_url(
    *,
    s3_path: str,
    request_time: RequestTime,
    aws_credentials: AWSCredentials,
    aws_region: str,
) -> str:
    """Get a signed URL for the given S3 path.
    This is the third step in the S3 signing process.
    """
    bucket, resource = parse_s3_path(s3_path)
    canonical_request, canonical_query = _create_canonical_request(
        resource_key=resource,
        aws_server_public_key=aws_credentials.access_key,
        aws_server_session_token=aws_credentials.token,
        request_time=request_time,
        aws_bucket=bucket,
        aws_region=aws_region,
    )
    signature = _create_signature(
        aws_server_secret_key=aws_credentials.secret_key,
        canonical_request=canonical_request,
        request_time=request_time,
        aws_region=aws_region,
    )
    # Remove the leading slash from the resource as we don't want to escape it.
    resource_escaped = urllib.parse.quote(resource.lstrip("/"), safe=SAFE_CHARS)
    return (
        f"https://{bucket}.s3.amazonaws.com/{resource_escaped}"
        f"?{canonical_query}&X-Amz-Signature={signature}"
    )


async def get_s3_client(boto_session_maker: BotoSessionFn) -> Any:
    def get_s3_client_fn() -> Any:
        boto_session = boto_session_maker()
        # NOTE(@lberg): clients are generally thread safe, so we can
        # return this from the thread this function is called in.
        # https://boto3.amazonaws.com/v1/documentation/api/1.17.90/guide/clients.html
        return boto_session.client("s3")

    return await run_async(get_s3_client_fn)


class S3CopyError(Exception):
    pass


class S3UploadError(Exception):
    pass


async def s3_copy(s3_client: Any, *, src_path: S3Path, dst_path: S3Path) -> None:
    try:
        src_bucket, src_key = src_path.bucket_and_key(True)
        dest_bucket, dest_key = dst_path.bucket_and_key(True)
    except ValueError as ex:
        raise S3CopyError(f"Failed to parse s3 paths: {ex}")

    try:
        await run_async(
            functools.partial(
                s3_client.copy_object,
                CopySource={"Bucket": src_bucket, "Key": src_key},
                Bucket=dest_bucket,
                Key=dest_key,
                # drop all tags
                TaggingDirective="REPLACE",
            )
        )
    except ClientError as ex:
        raise S3CopyError(f"Failed to copy {src_path} to {dst_path} : {ex}")


async def s3_upload(s3_client: Any, *, bucket: str, key: str, file: BinaryIO) -> None:
    try:
        await run_async(
            functools.partial(s3_client.put_object, Bucket=bucket, Key=key, Body=file)
        )
    except ClientError as ex:
        raise S3UploadError(f"Failed to upload file to {bucket}/{key} : {ex}")
