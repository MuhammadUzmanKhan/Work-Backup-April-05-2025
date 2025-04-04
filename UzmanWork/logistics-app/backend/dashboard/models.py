from pydantic import BaseModel, EmailStr

from backend.database.dashboard_models import DashboardReport
from backend.utils import AwareDatetime


class DashboardDetailsUpdateRequest(BaseModel):
    id: int
    title: str
    description: str


class ReportsOrderUpdateRequest(BaseModel):
    reports_order: list[int]


class UserFavoriteDashboardUpdateRequest(BaseModel):
    dashboard_id: int
    is_favorite: bool


class DashboardResponse(BaseModel):
    id: int
    title: str
    description: str | None
    owner_user_email: EmailStr
    creation_time: AwareDatetime
    reports: list[DashboardReport]


class DashboardSummary(BaseModel):
    id: int
    title: str
    is_favorite: bool
    creation_time: AwareDatetime
    owner_user_email: EmailStr


class DashboardsSummaryReponse(BaseModel):
    all_dashboards_summary: list[DashboardSummary]
    recently_viewed_dashboards_ids: list[int]
    default_dashboard_id: int | None
