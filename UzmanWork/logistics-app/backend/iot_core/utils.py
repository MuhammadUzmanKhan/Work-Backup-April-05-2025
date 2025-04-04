import os
import time
from typing import Callable

from pydantic import BaseModel

from backend.boto_utils import BotoIotDataClient
from backend.instrumentation.influx_serializer import InfluxSerializer
from backend.instrumentation.utils import instrument


class IotCoreQueueSettings(BaseModel):
    name: str
    nvr_uuid: str

    @property
    def topic(self) -> str:
        return f"{self.nvr_uuid}/{self.name}"


IotCoreQueueFactoryType = Callable[[str], IotCoreQueueSettings]

LIVE_STREAMING_IOT_QUEUE_FACTORY: IotCoreQueueFactoryType = (
    lambda nvr_uuid: IotCoreQueueSettings(name="live-streaming", nvr_uuid=nvr_uuid)
)

CLIP_STREAMING_IOT_QUEUE_FACTORY: IotCoreQueueFactoryType = (
    lambda nvr_uuid: IotCoreQueueSettings(name="clip-streaming", nvr_uuid=nvr_uuid)
)

CLIP_UPLOAD_IOT_QUEUE_FACTORY: IotCoreQueueFactoryType = (
    lambda nvr_uuid: IotCoreQueueSettings(name="clip-upload", nvr_uuid=nvr_uuid)
)

TEXT_SEARCH_IOT_QUEUE_FACTORY: IotCoreQueueFactoryType = (
    lambda nvr_uuid: IotCoreQueueSettings(name="text-search", nvr_uuid=nvr_uuid)
)

UNIQUE_FACE_SHARE_IOT_QUEUE_FACTORY: IotCoreQueueFactoryType = (
    lambda nvr_uuid: IotCoreQueueSettings(name="face-share", nvr_uuid=nvr_uuid)
)

JOURNEY_EMBEDDING_IOT_QUEUE_FACTORY: IotCoreQueueFactoryType = (
    lambda nvr_uuid: IotCoreQueueSettings(name="journey-embedding", nvr_uuid=nvr_uuid)
)

JOURNEY_SEARCH_IOT_QUEUE_FACTORY: IotCoreQueueFactoryType = (
    lambda nvr_uuid: IotCoreQueueSettings(name="journey-search", nvr_uuid=nvr_uuid)
)

NETWORK_SCAN_IOT_QUEUE_FACTORY: IotCoreQueueFactoryType = (
    lambda nvr_uuid: IotCoreQueueSettings(
        name="network-scan-request", nvr_uuid=nvr_uuid
    )
)

UPLOADED_FACE_PROCESS_IOT_QUEUE_FACTORY: IotCoreQueueFactoryType = (
    lambda nvr_uuid: IotCoreQueueSettings(
        name="uploaded-face-process", nvr_uuid=nvr_uuid
    )
)


# TODO(@lberg): consider removing if not used
# 09/04/2024, track the latency of sending to iot-core
async def instrument_iot_core_msg_send(
    duration_s: float, queue_setting: IotCoreQueueSettings
) -> str:
    host_name = os.environ.get("HOSTNAME", "unknown")
    serializer = InfluxSerializer(measurement_name="iot_core_message_sent")
    serializer.add_tag("docker_container_id", host_name)
    serializer.add_tag("nvr_uuid", queue_setting.nvr_uuid)
    serializer.add_tag("queue_name", queue_setting.name)
    serializer.add_field("duration_s", duration_s)
    return serializer.get_as_string()


async def send_msg_to_nvr_through_iot(
    queue_setting: IotCoreQueueSettings,
    message: str,
    iot_data_client: BotoIotDataClient,
) -> None:
    start_time = time.time()
    await iot_data_client.publish(topic=queue_setting.topic, payload=message)
    await instrument(
        instrument_iot_core_msg_send(time.time() - start_time, queue_setting)
    )
