import pytest

from backend.database import database, orm
from backend.database.organization_models import Organization
from backend.kiosk.utils import KioskAction
from backend.test.kiosk.factory_types import KioskFactory


@pytest.mark.parametrize("is_user_admin", [(True, False)])
async def test_creator_can_do_anything(
    create_kiosk: KioskFactory,
    db_instance: database.Database,
    organization: Organization,
    is_user_admin: bool,
) -> None:
    creator_user_email = "creator_email"
    kiosk_id = await create_kiosk(creator_user_email=creator_user_email)
    assert kiosk_id == 1

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        for action in KioskAction:
            assert await orm.Kiosk.check_user_is_allowed(
                session=session,
                kiosk_id=kiosk_id,
                user_email=creator_user_email,
                is_user_admin=is_user_admin,
                action=action,
            )


async def test_admin_can_do_something(
    create_kiosk: KioskFactory,
    db_instance: database.Database,
    organization: Organization,
) -> None:
    creator_user_email = "creator_email"
    admin_email = "admin_email"
    kiosk_id = await create_kiosk(creator_user_email=creator_user_email)
    assert kiosk_id == 1
    can_do_actions = [
        KioskAction.READ,
        KioskAction.UPDATE_IS_ENABLED,
        KioskAction.DELETE,
        KioskAction.REGENERATE_HASH,
        KioskAction.RENAME,
    ]

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        for action in KioskAction:
            if action in can_do_actions:
                assert await orm.Kiosk.check_user_is_allowed(
                    session=session,
                    kiosk_id=kiosk_id,
                    user_email=admin_email,
                    is_user_admin=True,
                    action=action,
                )
            else:
                assert not await orm.Kiosk.check_user_is_allowed(
                    session=session,
                    kiosk_id=kiosk_id,
                    user_email=admin_email,
                    is_user_admin=True,
                    action=action,
                )


async def test_other_user_can_do_nothing(
    create_kiosk: KioskFactory,
    db_instance: database.Database,
    organization: Organization,
) -> None:
    creator_user_email = "creator_email"
    other_user_email = "other_email"
    kiosk_id = await create_kiosk(creator_user_email=creator_user_email)
    assert kiosk_id == 1

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        for action in KioskAction:
            assert not await orm.Kiosk.check_user_is_allowed(
                session=session,
                kiosk_id=kiosk_id,
                user_email=other_user_email,
                is_user_admin=False,
                action=action,
            )
