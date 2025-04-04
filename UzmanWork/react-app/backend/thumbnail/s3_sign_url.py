import datetime
from typing import Iterable

from backend.aws_signer.aws_signer_models import AWSCredentials
from backend.s3_utils import RequestTime, get_signed_url
from backend.thumbnail.models import ThumbnailResult


def sign_thumbnails(
    *,
    thumbnails: Iterable[ThumbnailResult],
    aws_credentials: AWSCredentials,
    aws_region: str,
) -> None:
    """Sign thumbnails in bulk."""
    request_time = RequestTime.from_datetime(datetime.datetime.utcnow())
    for thumbnail in thumbnails:
        thumbnail.s3_signed_url = get_signed_url(
            s3_path=thumbnail.s3_path,
            request_time=request_time,
            aws_credentials=aws_credentials,
            aws_region=aws_region,
        )
