import logging

from pydantic import BaseModel

from backend import logging_config
from backend.database import database, orm
from backend.database.models import CamerasQueryConfig
from backend.db_utils import get_org_name_or_unknown
from backend.monitor.alert import AlertOrgGrouped, AlertSeverity
from backend.monitor.alert_types import AlertType
from backend.organizations.constants import (
    SLACK_CHANNEL_EXCEEDED_NUMBER_OF_LICENSED_CAMERAS,
)
from backend.slack_client import SlackClient

logger = logging.getLogger(logging_config.LOGGER_NAME)


class OverLicensedOrgData(BaseModel):
    tenant: str
    num_licensed_cameras: int
    num_enabled_cameras: int


async def _get_over_licensed_orgs(db: database.Database) -> list[OverLicensedOrgData]:
    over_licensed_orgs = []

    async with db.session() as session:
        orgs = await orm.Organization.system_get_orgs(session)

    # for each org, check the number of active cameras against the licensed ones
    for org in orgs:
        async with db.tenant_session(tenant=org.tenant) as session:
            num_licensed_cameras = (
                await orm.Organization.get_org_number_licensed_cameras(session)
            )

            if num_licensed_cameras is None:
                continue

            num_enabled_cameras = len(
                await orm.Camera.get_cameras(
                    session, CamerasQueryConfig(exclude_disabled=True)
                )
            )
        if num_enabled_cameras > num_licensed_cameras:
            over_licensed_orgs.append(
                OverLicensedOrgData(
                    tenant=org.tenant,
                    num_licensed_cameras=num_licensed_cameras,
                    num_enabled_cameras=num_enabled_cameras,
                )
            )

    return over_licensed_orgs


async def send_slack_alert_for_over_licensed_orgs(
    db: database.Database, slack_client: SlackClient
) -> None:
    over_licensed_orgs = await _get_over_licensed_orgs(db)
    if not over_licensed_orgs:
        logger.info("No over-licensed orgs found")
        return

    for org in over_licensed_orgs:
        logger.info(f"Found over-licensed org: {org}")
        await slack_client.send_alert(
            AlertOrgGrouped(
                org_name=await get_org_name_or_unknown(db, org.tenant),
                alert_type=AlertType.EXCEED_NUMBER_OF_LICENSED_CAMERAS_IN_ORGANIZATION,
                alert_severity=AlertSeverity.WARNING,
                detailed_info={
                    "num_licensed_cameras": str(org.num_licensed_cameras),
                    "num_enabled_cameras": str(org.num_enabled_cameras),
                },
            ),
            channel=SLACK_CHANNEL_EXCEEDED_NUMBER_OF_LICENSED_CAMERAS,
        )
