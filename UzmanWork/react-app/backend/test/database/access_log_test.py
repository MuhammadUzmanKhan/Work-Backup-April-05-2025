from backend.access_logs.constants import UserActions
from backend.database import database, orm
from backend.database.organization_models import Organization


async def test_new_access_log(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.AccessLog.new_log(
            session,
            action=UserActions.UPDATED_ORG_FLAG,
            user_email="email",
            ip_address="127.0.0.1",
            details={"blah": "blah"},
        )
