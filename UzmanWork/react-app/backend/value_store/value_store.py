from datetime import timedelta, timezone
from typing import TYPE_CHECKING, Type, TypeAlias, TypeVar

import redis.asyncio as redis
from pydantic import BaseModel

from backend.utils import AwareDatetime

# See https://github.com/python/typeshed/issues/8242
# Redis is not shipped with type annotations, and the stubs have issues
if TYPE_CHECKING:
    Redis: TypeAlias = redis.Redis[bytes]  # this will be picked up by mypy

else:
    Redis: TypeAlias = redis.Redis  # this will be picked up by fastapi

TBaseModel = TypeVar("TBaseModel", bound=BaseModel)


class ValueStore:
    redis_client: Redis

    def __init__(self, host: str, port: int) -> None:
        self.redis_client = redis.Redis(host=host, port=port)

    @staticmethod
    def _get_model_key(model: Type[TBaseModel]) -> str:
        return f"{model.__name__}"

    @staticmethod
    def _set_model_key(model: TBaseModel) -> str:
        return f"{model.__class__.__name__}"

    async def set_model(
        self,
        key: str,
        model: BaseModel,
        expiration: timedelta | None = timedelta(days=2),
    ) -> None:
        key = f"{ValueStore._set_model_key(model)}:{key}"
        await self.redis_client.set(key, model.json(), ex=expiration)

    async def get_model(
        self, key: str, model_class: Type[TBaseModel]
    ) -> TBaseModel | None:
        key = f"{ValueStore._get_model_key(model_class)}:{key}"
        raw_model = await self.redis_client.get(key)
        if raw_model is None:
            return raw_model
        return model_class.parse_raw(raw_model)

    async def hset_model(self, key: str, mapping_key: str, model: BaseModel) -> None:
        key = f"{ValueStore._set_model_key(model)}:{key}"
        await self.redis_client.hset(key, mapping_key, model.json())

    async def hget_model(
        self, key: str, mapping_key: str, model_class: Type[TBaseModel]
    ) -> TBaseModel | None:
        key = f"{ValueStore._get_model_key(model_class)}:{key}"
        raw_model = await self.redis_client.hget(key, mapping_key)
        return model_class.parse_raw(raw_model) if raw_model else None

    async def hgetall_models(
        self, key: str, model_class: Type[TBaseModel]
    ) -> dict[str, TBaseModel]:
        key = f"{ValueStore._get_model_key(model_class)}:{key}"
        all_mappings = await self.redis_client.hgetall(key)
        return {
            mapping_key.decode("utf-8"): model_class.parse_raw(raw_model)
            for mapping_key, raw_model in all_mappings.items()
        }

    async def hdel_model(
        self, key: str, *mapping_keys: str, model_class: Type[TBaseModel]
    ) -> None:
        # Skip deletion if no mapping keys are provided
        if len(mapping_keys) == 0:
            return

        key = f"{ValueStore._get_model_key(model_class)}:{key}"
        await self.redis_client.hdel(key, *mapping_keys)

    async def get_model_with_expiration(
        self, key: str, model_class: Type[TBaseModel]
    ) -> tuple[TBaseModel | None, int | None]:
        key = f"{ValueStore._get_model_key(model_class)}:{key}"
        raw_model = await self.redis_client.get(key)
        if raw_model is None:
            return None, None

        model = model_class.parse_raw(raw_model)
        ttl = await self.redis_client.ttl(key)
        expires_in = ttl if ttl not in {-1, -2} else None

        return model, expires_in

    async def del_model(self, keys: list[str], model_class: Type[TBaseModel]) -> None:
        if len(keys) == 0:
            return

        await self.redis_client.delete(
            *[f"{ValueStore._get_model_key(model_class)}:{key}" for key in keys]
        )

    async def set_multiple_models(self, keys_models: dict[str, BaseModel]) -> None:
        if not keys_models:
            return

        await self.redis_client.mset(
            {
                f"{ValueStore._set_model_key(model)}:{key}": model.json()
                for key, model in keys_models.items()
            }
        )

    async def get_multiple_models(
        self, keys: list[str], model_class: Type[TBaseModel]
    ) -> dict[str, TBaseModel | None]:
        models = await self.redis_client.mget(
            [f"{ValueStore._get_model_key(model_class)}:{key}" for key in keys]
        )

        return {
            key: model_class.parse_raw(model) if model else None
            for key, model in zip(keys, models)
        }

    async def set_timestamp(
        self, key: str, time: AwareDatetime, expiration: timedelta | None = None
    ) -> None:
        await self.redis_client.set(f"timestamp:{key}", time.timestamp(), ex=expiration)

    async def get_timestamp(self, key: str) -> AwareDatetime | None:
        val = await self.redis_client.get(f"timestamp:{key}")
        if val is None:
            return None
        return AwareDatetime.fromtimestamp(float(val), tz=timezone.utc)

    async def get_multiple_timestamps(
        self, keys: list[str]
    ) -> dict[str, AwareDatetime | None]:
        timestamps = await self.redis_client.mget([f"timestamp:{key}" for key in keys])

        return {
            key: (
                AwareDatetime.fromtimestamp(float(timestamp), tz=timezone.utc)
                if timestamp
                else None
            )
            for key, timestamp in zip(keys, timestamps)
        }

    async def set_multiple_timestamps(
        self, keys_timestamps: dict[str, AwareDatetime]
    ) -> None:
        if not keys_timestamps:
            return

        await self.redis_client.mset(
            {
                f"timestamp:{key}": timestamp.astimezone(timezone.utc).timestamp()
                for key, timestamp in keys_timestamps.items()
            }
        )


def get_user_last_activity_key(user_email: str) -> str:
    return f"last_activity:{user_email}"


def get_nvr_last_alerted_key(nvr_uuid: str) -> str:
    return f"nvr_last_alerted:{nvr_uuid}"


def get_camera_last_alerted_key(mac_address: str) -> str:
    return f"camera_last_alerted:{mac_address}"


def get_nvr_last_alerted_status_key(nvr_uuid: str) -> str:
    return f"nvr_last_alerted_status:{nvr_uuid}"


def get_camera_last_alerted_status_key(mac_address: str) -> str:
    return f"camera_last_alerted_status:{mac_address}"


def get_nvr_last_internet_status_key(nvr_uuid: str) -> str:
    return f"nvr_last_internet_status:{nvr_uuid}"


def get_nvr_kvs_connection_status_key(nvr_uuid: str) -> str:
    return f"nvr_kvs_connection_status:{nvr_uuid}"


def get_camera_pipeline_alert_key(mac_address: str) -> str:
    return f"camera_pipeline_alert:{mac_address}"


def get_recent_camera_pipeline_alerts_key(mac_address: str) -> str:
    return f"recent_camera_pipeline_alerts:{mac_address}"


def get_edge_status_update_key(nvr_uuid: str) -> str:
    return f"edge_status_update:{nvr_uuid}"


def get_shared_live_stream_key(unique_uuid: str) -> str:
    return f"shared_live_stream_:{unique_uuid}"


def get_nvr_discovery_key(unique_uuid: str) -> str:
    return unique_uuid


def get_person_of_interest_alert_key(alert_profile_id: int) -> str:
    return f"poi_last_alerted_status:{alert_profile_id}"


def get_license_plate_of_interest_alert_key(alert_profile_id: int) -> str:
    return f"lpoi_last_alerted_status:{alert_profile_id}"


def get_aws_sign_request_key(sign_token: str) -> str:
    return sign_token


def get_user_alert_last_run_key(alert_type: str) -> str:
    return f"user_alert_last_run:{alert_type}"
