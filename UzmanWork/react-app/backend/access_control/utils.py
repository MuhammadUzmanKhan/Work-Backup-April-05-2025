import logging

import fastapi
from fastapi import HTTPException

from backend import logging_config
from backend.access_control.alta import utils as alta_utils
from backend.access_control.alta.client import AltaClient
from backend.access_control.alta.models import AltaError
from backend.access_control.brivo import utils as brivo_utils
from backend.access_control.brivo.client import BrivoClient
from backend.access_control.brivo.models import BrivoError
from backend.access_control.models import AccessPointResponse
from backend.database import access_points_models as ap_models
from backend.database import orm
from backend.database.access_points_models import (
    AccessPointIdentifier,
    AccessPointVendor,
)
from backend.database.database import Database
from backend.value_store import ValueStore

logger = logging.getLogger(logging_config.LOGGER_NAME)


async def get_access_point_or_fail(
    access_point_id: str, vendor: AccessPointVendor, db: Database
) -> ap_models.AccessPoint:
    async with db.tenant_session() as session:
        try:
            return await orm.AccessPoint.get_access_point(
                session,
                ap_identifier=AccessPointIdentifier(id=access_point_id, vendor=vendor),
            )
        except ap_models.AccessPointError:
            raise HTTPException(
                status_code=fastapi.status.HTTP_404_NOT_FOUND,
                detail="Access point not found",
            )


async def fetch_api_access_points(
    tenant: str,
    brivo_client: BrivoClient,
    alta_client: AltaClient,
    db: Database,
    value_store: ValueStore,
) -> list[AccessPointResponse]:
    async with db.tenant_session() as session:
        has_brivo = await orm.BrivoIntegration.has_brivo_integration(session)
        has_alta = await orm.AltaIntegration.has_alta_integration(session)

    if has_brivo:
        try:
            brivo_access_points = await brivo_utils.list_brivo_access_points(
                brivo_client=brivo_client, tenant=tenant, db=db, value_store=value_store
            )
        except BrivoError as e:
            logger.error(f"Failed to list Brivo access points for {tenant=}: {e}")
            brivo_access_points = []
    else:
        brivo_access_points = []

    if has_alta:
        try:
            alta_access_points = await alta_utils.list_alta_access_points(
                alta_client=alta_client, db=db
            )
        except AltaError as e:
            logger.error(f"Failed to list Alta access points for {tenant=}: {e}")
            alta_access_points = []
    else:
        alta_access_points = []

    return brivo_access_points + alta_access_points
