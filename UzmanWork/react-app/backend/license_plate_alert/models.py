from pydantic import BaseModel


class RegisterLicencePlateAlertProfileRequest(BaseModel):
    license_plate_number: str


class UpdateNotificationGroupsRequest(BaseModel):
    notification_group_ids: set[int]
