import functools
from pathlib import Path

from botocore.exceptions import ClientError

from backend.boto_utils import BotoSessionFn
from backend.s3_utils import S3CopyError, S3Path, get_s3_client, s3_copy
from backend.sync_utils import run_async


class LicensePlateImageCopyError(Exception):
    pass


class LicensePlateImageDeleteError(Exception):
    pass


async def copy_s3_path_for_plate_alert(
    boto_session_maker: BotoSessionFn, s3_path: S3Path, tenant: str
) -> S3Path:
    try:
        s3_client = await get_s3_client(boto_session_maker)
    except ClientError as ex:
        raise LicensePlateImageCopyError(f"Failed to create s3 client: {ex}")
    bucket, old_key = s3_path.bucket_and_key(True)
    # we just suffix _alert to the current key
    # NOTE(@lberg): the image might be overwritten for multiple alerts
    # for the same license plate number.
    old_key_path = Path(old_key)
    suffix = f"_alert_{tenant}"
    new_key = old_key_path.parent / f"{old_key_path.stem}{suffix}{old_key_path.suffix}"
    new_s3_path = S3Path(f"s3://{bucket}/{new_key}")

    try:
        await s3_copy(s3_client, src_path=s3_path, dst_path=new_s3_path)
    except S3CopyError as ex:
        raise LicensePlateImageCopyError(
            f"Failed to copy {s3_path} to {new_s3_path} : {ex}"
        )
    return new_s3_path


async def delete_plate_alert_s3_image(
    boto_session_maker: BotoSessionFn, s3_path: S3Path
) -> None:
    try:
        s3_client = await get_s3_client(boto_session_maker)
    except ClientError as ex:
        raise LicensePlateImageDeleteError(f"Failed to create s3 client: {ex}")

    bucket, key = s3_path.bucket_and_key(True)
    try:
        await run_async(
            functools.partial(s3_client.delete_object, Bucket=bucket, Key=key)
        )
    except ClientError as ex:
        raise LicensePlateImageDeleteError(f"Failed to delete {s3_path}: {ex}")
