from fastapi import HTTPException, status
from pydantic import HttpUrl
from pydantic.tools import parse_obj_as

from backend.database import face_models, models
from backend.envs import BackendSecrets
from backend.s3_utils import RequestTime, get_signed_url


class FaceAlertS3PathNotExistsError(Exception):
    pass


def get_one_alert_profile_or_fail(
    alert_profiles: list[models.FaceAlertProfile],
) -> models.FaceAlertProfile:
    if len(alert_profiles) != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only one alert profile should be returned",
        )
    return alert_profiles[0]


def get_optional_signed_url(
    s3_path: str | None,
    request_time: RequestTime,
    secrets: BackendSecrets,
    region_name: str,
) -> HttpUrl | None:
    if s3_path is None:
        return None

    signed_url = get_signed_url(
        s3_path=s3_path,
        request_time=request_time,
        aws_credentials=secrets.aws_credentials(),
        aws_region=region_name,
    )
    http_url: HttpUrl = parse_obj_as(HttpUrl, signed_url)
    return http_url


def set_from_profile_identifier(
    identifier: face_models.OrgUniqueFaceIdentifier | models.FaceAlertProfileIdentifier,
) -> set[models.FaceAlertProfileIdentifier] | set[face_models.OrgUniqueFaceIdentifier]:
    if isinstance(identifier, face_models.OrgUniqueFaceIdentifier):
        return {identifier}
    else:
        return {identifier}
