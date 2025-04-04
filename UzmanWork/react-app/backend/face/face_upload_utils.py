import logging
import random
import string
from random import randint

from botocore.exceptions import ClientError
from fastapi import UploadFile
from pydantic import EmailStr

from backend import logging_config
from backend.boto_utils import BotoSessionFn
from backend.database import database, orm
from backend.database.models import FaceAlertProfileCreate
from backend.database.session import TenantAwareAsyncSession
from backend.envs import EnvValue
from backend.face.constants import FACES_S3_BUCKET
from backend.models import AccessRestrictions, NVRResponse
from backend.s3_utils import S3Path, S3UploadError, get_s3_client, s3_upload
from backend.utils import AwareDatetime

logger = logging.getLogger(logging_config.LOGGER_NAME)


class FaceUploadError(Exception):
    pass


class NoFaceFileNameError(FaceUploadError):
    pass


class NoNVRsFoundError(FaceUploadError):
    pass


class ProfileCreationError(FaceUploadError):
    pass


async def upload_face_to_s3(
    boto_session_maker: BotoSessionFn,
    face_file: UploadFile,
    upload_id: str,
    tenant: str,
    env_name: EnvValue,
) -> S3Path:
    if face_file.filename is None:
        raise NoFaceFileNameError(
            "No filename provided for the face image file, cannot upload to S3"
        )

    try:
        s3_client = await get_s3_client(boto_session_maker)
    except ClientError as ex:
        raise FaceUploadError(f"Failed to create s3 client: {ex}")

    s3_bucket = f"{FACES_S3_BUCKET}-{env_name}"
    s3_key = f"uploaded/{tenant}/{upload_id}_{face_file.filename}"

    try:
        await s3_upload(s3_client, bucket=s3_bucket, key=s3_key, file=face_file.file)
    except S3UploadError as ex:
        raise FaceUploadError(f"Failed to upload face to S3: {ex}")

    return S3Path(f"s3://{s3_bucket}/{s3_key}")


async def pick_nvr_for_face_upload(
    session: TenantAwareAsyncSession, access_restrictions: AccessRestrictions
) -> NVRResponse:
    """Pick an NVR we will send the face upload request to.
    Prefer online NVRs, but if none are available, pick any NVR."""
    nvrs = await orm.NVR.get_nvrs(session, access_restrictions, location_id=None)
    if not nvrs:
        raise NoNVRsFoundError("No NVRs available to process face image")
    online_nvrs = [nvr for nvr in nvrs if nvr.is_online]
    nvrs = online_nvrs or nvrs
    nvr = nvrs[randint(0, len(nvrs) - 1)]
    # NOTE(@lberg): it's not guaranteed that this NVR will be online in time
    # to process the face image.
    return nvr


async def register_uploaded_face(
    db: database.Database, profile_name: str, s3_path: S3Path, user_email: EmailStr
) -> int:
    async with db.tenant_session() as session:
        org_unique_face_id = await orm.OrganizationUniqueFace.create_unique_face(
            session, s3_path=s3_path
        )
        # Create a face alert profile for the new face too
        alert_profile = FaceAlertProfileCreate(
            owner_user_email=user_email,
            creation_time=AwareDatetime.utcnow(),
            description=profile_name,
            is_person_of_interest=False,
            org_unique_face_id=org_unique_face_id,
        )
        await orm.FaceAlertProfile.new_profile(session, alert_profile)
    return org_unique_face_id


def generate_uploaded_face_identifier() -> str:
    return "uploaded-face-" + "".join(
        random.choices(
            string.ascii_lowercase + string.digits + string.ascii_uppercase, k=25
        )
    )
