import asyncio
import csv
import logging
import os
import sys

sys.path.append(os.getcwd())

from backend.database import orm  # noqa: E402
from backend.database.models import FeatureFlags  # noqa: E402
from backend.database.organization_models import OrganizationCreate  # noqa: E402
from backend.dependencies import populate_database_tables  # noqa: E402
from scripts.database_util import get_database  # noqa: E402

ORGANIZATIONS_FILE = "scripts/local_db_data/organizations.csv"


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    db = get_database()
    await db.prepare_tables()
    await populate_database_tables(db, enable_all_features=True)

    async with db.session() as session:
        # Write organizations
        for org_input in csv.DictReader(open(ORGANIZATIONS_FILE)):
            organization = OrganizationCreate(
                name=org_input["name"], tenant=org_input["tenant"]
            )
            await orm.Organization.system_new_organization(session, organization)

    for org_input in csv.DictReader(open(ORGANIZATIONS_FILE)):
        async with db.tenant_session(tenant=org_input["tenant"]) as session:
            for feature in FeatureFlags:
                await orm.OrganizationFeature.new_organization_feature(session, feature)


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
