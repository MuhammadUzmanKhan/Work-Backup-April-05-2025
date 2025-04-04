from backend.models import (
    KvsCheckerResult,
    KvsCheckerResultLegacy,
    NvrKvsConnectionStatus,
)


async def test_convert_legacy_kvs_check_result() -> None:
    model = NvrKvsConnectionStatus(
        exception_msg=None,
        check_result=KvsCheckerResultLegacy.NO_INTERNET_CONNECTION.value,
    )

    assert model.check_result == KvsCheckerResult.NO_INTERNET_CONNECTION
