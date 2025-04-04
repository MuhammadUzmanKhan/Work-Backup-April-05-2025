from pydantic import BaseModel

from backend.database.models import (
    NotificationGroup,
    NotificationGroupMemberCreate,
    NotificationGroupMemberUpdate,
)


class NotificationGroupsResponse(BaseModel):
    notification_groups: list[NotificationGroup]


class AddNotificationGroupMemberRequest(BaseModel):
    notification_group_member: NotificationGroupMemberCreate


class UpdateNotificationGroupMemberRequest(BaseModel):
    notification_group_member: NotificationGroupMemberUpdate
