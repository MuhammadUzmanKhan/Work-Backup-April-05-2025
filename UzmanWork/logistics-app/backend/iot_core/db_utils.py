import enum

from backend.database import database, orm
from backend.database.models import FeatureFlags


class IOTCoreFeature(enum.Enum):
    VIDEO = "video"
    DISCOVERY = "discovery"
    TEXT_SEARCH = "text_search"
    JOURNEY = "journey"


async def is_iot_core_feature_enabled(
    db: database.Database, iot_core_feature: IOTCoreFeature, tenant: str
) -> bool:
    flag = None
    match iot_core_feature:
        case IOTCoreFeature.VIDEO:
            flag = FeatureFlags.IOT_CORE_VIDEO_ENABLED
        case IOTCoreFeature.DISCOVERY:
            flag = FeatureFlags.IOT_CORE_DISCOVERY_ENABLED
        case IOTCoreFeature.TEXT_SEARCH:
            flag = FeatureFlags.IOT_CORE_TEXT_SEARCH_ENABLED
        case IOTCoreFeature.JOURNEY:
            flag = FeatureFlags.IOT_CORE_JOURNEY_ENABLED

    async with db.session() as session:
        return await orm.Feature.system_is_feature_enabled_across_tenants(
            session, flag, [tenant]
        )
