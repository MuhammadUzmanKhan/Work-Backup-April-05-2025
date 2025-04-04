import pytest

from backend.database import database, models, orm
from backend.database.organization_models import Organization
from backend.database.orm import orm_notification_group


async def test_get_notification_group(
    db_instance: database.Database,
    organization: Organization,
    notification_group: models.NotificationGroup,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        # Get notification group
        group = await orm.NotificationGroup.get_groups(
            session=session, group_ids={notification_group.id}
        )
        # Assert that the notification group is the same as the expected notification
        assert models.NotificationGroup.from_orm(group[0]) == notification_group


async def test_get_notification_group_with_invalid_group_id(
    db_instance: database.Database,
    organization: Organization,
    notification_group: models.NotificationGroup,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        # Get notification group with invalid group ID
        with pytest.raises(orm_notification_group.NotificationGroupNotFoundError):
            await orm.NotificationGroup.get_groups(
                session=session, group_ids={notification_group.id + 1}
            )
