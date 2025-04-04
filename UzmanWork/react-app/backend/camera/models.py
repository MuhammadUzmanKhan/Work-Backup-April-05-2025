import pydantic

from backend.database import camera_downtime_models


class GetCameraDowntimeResponse(pydantic.BaseModel):
    downtimes: list[camera_downtime_models.CameraDowntime]
