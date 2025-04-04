from datetime import timedelta

from fastapi import HTTPException, status

from backend.aws_signer.aws_signer_models import AwsSignToken
from backend.value_store.value_store import ValueStore, get_aws_sign_request_key


async def check_aws_sign_token(sign_token: str, value_store: ValueStore) -> None:
    """Check that the sign token exists in the value store."""
    sign_request = await value_store.get_model(
        get_aws_sign_request_key(sign_token), AwsSignToken
    )
    if sign_request is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sign request not found for {sign_token=}",
        )


async def generate_aws_sign_token(value_store: ValueStore) -> str:
    """Generate a new sign token and store it in the value store."""
    sign_token = AwsSignToken()
    await value_store.set_model(
        get_aws_sign_request_key(sign_token.sign_token),
        sign_token,
        expiration=timedelta(minutes=1440),
    )
    return sign_token.sign_token
