import datetime

import pytest

from backend.aws_signer.aws_signer_models import AWSCredentials
from backend.s3_utils import RequestTime, get_signed_url, parse_s3_path


# NOTE(@lberg): This is the same example from the AWS docs
# https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html
def test_get_signed_url() -> None:
    aws_server_public_key = "AKIAIOSFODNN7EXAMPLE"
    aws_server_secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
    request_time = RequestTime.from_datetime(datetime.datetime(2013, 5, 24, 0, 0, 0))
    signed_url = get_signed_url(
        s3_path="s3://examplebucket/test.txt",
        request_time=request_time,
        aws_credentials=AWSCredentials(
            access_key=aws_server_public_key,
            secret_key=aws_server_secret_key,
            token=None,
        ),
        aws_region="us-east-1",
    )
    assert (
        signed_url == "https://examplebucket.s3.amazonaws.com/test.txt?"
        "X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential="
        "AKIAIOSFODNN7EXAMPLE%2F20130524%2Fus-east-1%2Fs3%2Faws4_"
        "request&X-Amz-Date=20130524T000000Z&X-Amz-Expires=86400&X"
        "-Amz-SignedHeaders=host&X-Amz-Signature=aeeed9bbccd4d02ee5"
        "c0109b86d86835f995330da4c265957d157751f604d404"
    )


def test_parse_s3_path() -> None:
    # Unit test for parse_s3_path

    # Test with a valid path
    s3_path = "s3://bucket/key"
    bucket, key = parse_s3_path(s3_path)
    assert bucket == "bucket"
    assert key == "/key"

    # Test with a path that doesn't start with s3://
    s3_path = "bucket/key"
    with pytest.raises(ValueError):
        parse_s3_path(s3_path)

    # Test with a path that doesn't have a bucket
    s3_path = "s3:///key"
    with pytest.raises(ValueError):
        bucket, key = parse_s3_path(s3_path)

    # Test with a path that doesn't have a key
    s3_path = "s3://bucket"
    with pytest.raises(ValueError):
        bucket, key = parse_s3_path(s3_path)

    # Test with a path that has a fragment
    s3_path = "s3://bucket/key#fragment"
    with pytest.raises(ValueError):
        parse_s3_path(s3_path)

    # Test with a path that has a query
    s3_path = "s3://bucket/key?query"
    with pytest.raises(ValueError):
        parse_s3_path(s3_path)

    # Test with a path that has a username
    s3_path = "s3://username@bucket/key"
    with pytest.raises(ValueError):
        parse_s3_path(s3_path)

    # Test with a path that has a password
    s3_path = "s3://username:password@bucket/key"
    with pytest.raises(ValueError):
        parse_s3_path(s3_path)

    # Test with a path that has a port
    s3_path = "s3://bucket:port/key"
    with pytest.raises(ValueError):
        parse_s3_path(s3_path)
