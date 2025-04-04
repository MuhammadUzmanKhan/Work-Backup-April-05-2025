from backend.database import orm
from backend.database.database import Database


async def get_org_name_or_unknown(db: Database, tenant: str) -> str:
    async with db.tenant_session(tenant=tenant) as session:
        return await orm.Organization.get_org_name_or_unknown_from_session(session)
