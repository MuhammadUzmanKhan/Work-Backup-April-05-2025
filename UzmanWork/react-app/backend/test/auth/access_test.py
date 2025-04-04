from typing import Any, Callable, Optional

import fastapi
import fastapi.dependencies.models
import fastapi.params

from backend import auth
from backend.kinesis_api.constants import (
    HLS_MASTER_PLAYLIST_ROUTE,
    HLS_MEDIA_PLAYLIST_ROUTE,
)

PUBLIC_ENDPOINTS = {
    "/shared_videos_public/info/{unique_hash}",
    "/shared_videos_public/exchange/{unique_hash}",
    "/shared_videos_public/download/{unique_hash}",
    "/shared_videos_public/info/live/{unique_uuid}",
    "/shared_videos_public/exchange/live/{unique_uuid}",
    "/shared_videos_public/live/keep_alive/{unique_uuid}",
    f"/kinesis_api_public/{HLS_MASTER_PLAYLIST_ROUTE}",
    f"/kinesis_api_public/{HLS_MEDIA_PLAYLIST_ROUTE}",
    "/kinesis_api_public/live_kiosk/{kiosk_hash}",
    "/kinesis_api_public/request_live_kiosk/{kiosk_hash}",
    "/monitor/backend_health",
    "/monitor/db_health",
    "/members/permanently_delete_own_user",
    "/kiosk_public/{kiosk_hash}",
    "/kiosk_public/{kiosk_hash}/next_wall",
    "/kiosk_public/{kiosk_hash}/live_kiosk",
    "/kiosk_public/{kiosk_hash}/live_data_kiosk",
    "/kiosk_public/{kiosk_hash}/keep_wall_alive",
    "/access_control/authorize_brivo",
    "/kinesis_api_public/sign_webrtc_request",
    "/versioning/check_frontend_requires_update",
}

LIVE_ONLY_USER_GROUP_LOCATION_RESTRICTED_ENDPOINTS = {
    "/kinesis_api/live_data",
    "/kinesis_api/request_live",
    "/groups",
    "/groups_with_location",
    "/locations",
    "/cameras/{camera_id}",
    "/cameras/downtime/{camera_id}",
    "/cameras",
    "/cameras/",
    "/devices/nvrs",
    "/devices/get_camera_pipeline_alerts",
    "/devices/get_recent_camera_pipeline_alerts",
    "/monitor/video_stream_alert",
    "/thumbnail/most_recent_thumbnails",
    "/thumbnail/most_recent_thumbnail_enlarged",
}
LIVE_ONLY_USER_UNRESTRICTED_ENDPOINTS = {
    "/organizations",
    "/features",
    "/org_flags/get_org_flag",
    "/members/update_user_name",
    "/user_wall/create_wall",
    "/user_wall/edit_tiles/{wall_id}",
    "/user_wall/delete_wall/{wall_id}",
    "/user_wall/",
    "/user_wall/tiles/{wall_id}",
    "/user_wall/rename_wall",
    "/user_wall/copy_wall",
    "/user_wall/is_used_in_kiosk",
}

LIVE_ONLY_USER_ENDPOINTS = (
    LIVE_ONLY_USER_GROUP_LOCATION_RESTRICTED_ENDPOINTS
    | LIVE_ONLY_USER_UNRESTRICTED_ENDPOINTS
)

LIMITED_USER_GROUP_LOCATION_RESTRICTED_ENDPOINTS = {
    "/kinesis_api/get_clip_upload_request",
    "/kinesis_api/clip",
    "/kinesis_api/abort_clip_upload",
    "/perceptions/aggregate",
    "/perceptions/analytics_query",
    "/thumbnail/timelapse",
    "/thumbnail/query_thumbnails_range",
    "/thumbnail/query_thumbnails_timestamps",
    "/text_search/",
    "/text_search/single_camera_search",
    "/text_search/multi_camera_search",
    "/text_search/perform_single_camera_search",
    "/text_search/perform_multi_camera_search",
    "/text_search/assistant",
    "/journey/embedding_websocket",
    "/journey/journey_websocket",
    "/journey/journey",
    "/journey/journey_from_track",
    "/journey/retrieve_tracks_thumbnail",
    "/archive/add_clip/{archive_id}",
    "/archive/clip",
    "/archive/",
}
LIMITED_USER_UNRESTRICTED_ENDPOINTS = {
    "/user_alerts/update_setting_name",
    "/user_alerts/delete",
    "/user_alerts/create",
    "/user_alerts/update",
    "/user_alerts/alert_settings",
    "/user_alerts/alerts",
    "/archive/user_archives",
    "/archive/{archive_id}",
    "/archive/summary",
    "/archive/share",
    "/archive/unshare/{archive_id}",
    "/archive/delete/{archive_id}",
    "/archive/update_description/{archive_id}",
    "/archive/update_title/{archive_id}",
    "/archive/comment",
    "/archive/{archive_id}/comments",
    "/archive/{archive_id}/tags",
    "/archive/{archive_id}/clip/{clip_id}/thumbnails",
    "/tags/",
    "/user_wall/share_wall",
    "/user_wall/unshare_wall",
    "/dashboard/",
    "/dashboard/{dashboard_id}",
    "/dashboard/{dashboard_id}/reports-order",
    "/dashboard/summary",
    "/dashboard/update_user_favorite",
    "/dashboard/reports/",
    "/dashboard/reports/{report_id}",
    "/dashboard/reports/data/{report_id}",
    "/dashboard/reports/{report_id}/actions/clone",
    "/dashboard/reports/actions/data/preview",
}

LIMITED_USER_ENDPOINTS = (
    LIMITED_USER_GROUP_LOCATION_RESTRICTED_ENDPOINTS
    | LIMITED_USER_UNRESTRICTED_ENDPOINTS
)

REGULAR_USER_GROUP_LOCATION_RESTRICTED_ENDPOINTS = {
    "/kinesis_api/s3_upload_and_fetch",
    "/face/unique_faces",
    "/face/face_occurrences",
    "/face/track_thumbnail_from_face_occurrence",
    "/face_alert/alert_occurrences/{alert_profile_id}",
    "/face_alert/latest_person_of_interest_alert_occurrences",
    "/face_alert/register_alert_profile",
    "/license_plate/license_plates",
    "/license_plate/license_plate_occurrences",
    "/shared_videos/live",
    "/face/upload_face_picture",
}

REGULAR_USER_UNRESTRICTED_ENDPOINTS = {
    "/shared_videos/",
    "/kiosk/create",
    "/kiosk/delete/{kiosk_id}",
    "/kiosk/update_walls",
    "/kiosk/rename",
    "/kiosk/update_status",
    "/kiosk/regenerate/{kiosk_id}",
    "/kiosk/share",
    "/kiosk/",
    "/access_control/list_access_points",
    "/access_control/list_events",
    "/face_alert/alert_profile",
    "/face_alert/alert_profiles",
    "/face_alert/delete_alert_profile/{alert_profile_id}",
    "/face_alert/update_profile_description/{alert_profile_id}",
    "/face_alert/update_person_of_interest_flag/{alert_profile_id}",
    "/face_alert/update_notification_groups/{alert_profile_id}",
    "/license_plate_alert/add_alert_profile",
    "/license_plate_alert/delete_alert_profile/{alert_profile_id}",
    "/license_plate_alert/profile_exists/{license_plate_number}",
    "/license_plate_alert/update_notification_groups/{alert_profile_id}",
    "/devices/cameras_export",
    "/devices/nvrs_export",
}

REGULAR_USER_ENDPOINTS = (
    REGULAR_USER_GROUP_LOCATION_RESTRICTED_ENDPOINTS
    | REGULAR_USER_UNRESTRICTED_ENDPOINTS
)

ADMIN_USER_ENDPOINTS = {
    "/devices/create_group",
    "/devices/validate_nvr",
    "/devices/register_nvr",
    "/devices/create_location",
    "/devices/enable_camera",
    "/devices/disable_camera",
    "/devices/rename_camera",
    "/devices/update_camera_group",
    "/devices/delete_camera_group",
    "/devices/update_camera_credentials",
    "/devices/update_camera_video_orientation_type",
    "/devices/update_camera_rtsp_url",
    "/devices/update_camera_flag",
    "/devices/update_webrtc_bulk_flag",
    "/devices/update_location_name",
    "/devices/update_nvr_location",
    "/devices/update_location_address",
    "/devices/update_location_enable_setting_timezone",
    "/devices/update_location_timezone",
    "/devices/delete_camera",
    "/devices/delete_location/{location_id}",
    "/members/list",
    "/members/create",
    "/members/update_user_role",
    "/members/update_user_access_restrictions",
    "/members/delete",
    "/org_flags/update_org_flag",
    "/organization_alert_subscribers/add",
    "/organization_alert_subscribers/remove",
    "/organization_alert_subscribers/list",
    "/organizations/create_organization",
    "/organizations/update_inactive_user_logout",
    "/organizations/update_low_res_bitrate",
    "/organizations/update_audio_settings",
    "/organizations/update_webrtc_settings",
    "/organizations/update_number_licensed_cameras",
    "/organizations/retrieve_number_licensed_cameras",
    "/organizations/update_network_scan_settings",
    "/organizations/retrieve_network_scan_settings",
    "/organizations/access_logs",
    "/cameras_registration/candidate_cameras/{location_id}",
    "/cameras_registration/register_candidates/{location_id}",
    "/notification_group/",
    "/notification_group/new_group",
    "/notification_group/rename_group/{group_id}",
    "/notification_group/delete_group/{group_id}",
    "/notification_group/new_group_member",
    "/notification_group/update_group_member/{group_member_id}",
    "/notification_group/delete_group_member/{group_member_id}",
    "/access_control/authorize_alta",
    "/access_control/set_location",
    "/access_control/assign_camera",
    "/access_control/unassign_camera",
    "/access_control/set_favorite_camera",
    "/access_control/list_integrations",
    "/access_control/brivo/set-api-key",
    "/access_control/brivo/get-api-key",
    "/access_control/integrations/{vendor}",
    "/access_control/access_points/actions/unlock",
    "/user_wall/count",
    "/retention_management/enforce_retention_thumbnails",
    "/retention_management/enforce_retention_mct_images",
    "/retention_management/enforce_retention_face_occurrences",
    "/retention_management/enforce_retention_detection_events",
    "/admin/organisations",
    "/admin/organisations/update_always_on_retention",
    "/admin/nvrs",
    "/admin/nvrs/update_retention",
    "/admin/nvrs/{nvr_uuid}/is_nvr_slots_locked",
    "/admin/nvrs/lock_nvr_slots",
    "/admin/nvrs/unlock_nvr_slots",
    "/admin/nvrs/{nvr_uuid}/unassign",
    "/admin/cameras",
}
EDGE_USER_ENDPOINTS = {
    "/monitor/edge_camera_alert",
    "/monitor/edge_status_update",
    "/monitor/camera_pipeline_alert",
    "/monitor/nvr_heartbeat",
    "/monitor/edge_health",
    "/monitor/update_timezone",
    "/monitor/internet_status",
    "/text_search/register_response",
    "/journey/register_embedding_response",
    "/journey/register_journey_response",
    "/journey/register_mct_images",
    "/perceptions/",
    "/kinesis_api/register_clip_uploads",
    "/stream_discovery",
    "/stream_discovery/upload",
    "/stream_discovery/status/{nvr_uuid}",
    "/thumbnail/register_thumbnails",
    "/face_edge/merge_faces",
    "/face_edge/register_faces",
    "/face_edge/register_uploaded_face_processed",
    "/face_alert_edge/alert_settings",
    "/face_alert_edge/register_alert_events",
    "/license_plate/register_image",
}

ALL_ENDPOINTS_APP = (
    PUBLIC_ENDPOINTS
    | LIVE_ONLY_USER_ENDPOINTS
    | LIMITED_USER_ENDPOINTS
    | REGULAR_USER_ENDPOINTS
    | ADMIN_USER_ENDPOINTS
)

ALL_ENDPOINTS_EDGE = EDGE_USER_ENDPOINTS

ALL_ENDPOINTS = ALL_ENDPOINTS_APP | ALL_ENDPOINTS_EDGE

ROLE_ENDPOINTS = {
    auth.UserRole.LIVE_ONLY: LIVE_ONLY_USER_ENDPOINTS,
    auth.UserRole.LIMITED: LIMITED_USER_ENDPOINTS,
    auth.UserRole.REGULAR: REGULAR_USER_ENDPOINTS,
    auth.UserRole.ADMIN: ADMIN_USER_ENDPOINTS,
}

DependencyType = Optional[Callable[..., Any]]


def _check_edge_user_dependency(path: str, dependency: DependencyType) -> bool:
    if isinstance(dependency, auth.RoleGuard):
        assert isinstance(dependency, auth.EdgeUserGuard), (
            f"Path {path} should have an EdgeUserGuard but instead has "
            f"{type(dependency)}"
        )
        return True
    return False


def _find_edge_user_guard(route: fastapi.routing.APIRoute) -> bool:
    for depends in route.dependencies:
        if _check_edge_user_dependency(route.path, depends.dependency):
            return True
    # We also have to check the dependant dependencies for some reason
    for subdependency in route.dependant.dependencies:
        if _check_edge_user_dependency(route.path, subdependency.call):
            return True
    return False


def _check_web_user_dependency(
    path: str, dependency: DependencyType, required_role: auth.UserRole
) -> bool:
    if isinstance(dependency, auth.RoleGuard):
        assert isinstance(
            dependency, auth.WebUserRoleGuard | auth.WebUserNoTenantRoleGuard
        ), f"Path {path} should have a WebUserRoleGuard but has {type(dependency)}"
        if dependency.required_role == required_role:
            return True
    return False


def _find_web_user_guard(
    route: fastapi.routing.APIRoute, required_role: auth.UserRole
) -> bool:
    for depends in route.dependencies:
        if _check_web_user_dependency(route.path, depends.dependency, required_role):
            return True
    # We also have to check the dependant dependencies because the UserGuard
    # is sometimes there instead of the dependencies property on the route.
    for subdependency in route.dependant.dependencies:
        if _check_web_user_dependency(route.path, subdependency.call, required_role):
            return True

    return False


def _check_path(route: fastapi.routing.APIRoute) -> None:
    if route.path in PUBLIC_ENDPOINTS:
        return
    if route.path in EDGE_USER_ENDPOINTS:
        assert _find_edge_user_guard(
            route
        ), f"Edge user path {route.path} is missing a user guard"
        return
    for role, path_list in ROLE_ENDPOINTS.items():
        if route.path in path_list:
            assert _find_web_user_guard(
                route, role
            ), f"Web user path {route.path} is missing a user guard for role {role}"
            return
    assert False, "unlisted route"


def _check_access_restrictions_path(route: fastapi.routing.APIRoute) -> None:
    for dep in route.dependant.dependencies:
        if dep.call == auth.get_user_access_restrictions:
            return
    assert False, (
        f"access restriction dependency not found for {route.path} but it should"
        " have one"
    )


def _check_no_access_restrictions_path(route: fastapi.routing.APIRoute) -> None:
    for dep in route.dependant.dependencies:
        if dep.call == auth.get_user_access_restrictions:
            assert False, (
                f"access restriction dependency found for {route.path} but it should"
                " not have one"
            )


def test_all_app_routes_listed(app_api: fastapi.FastAPI) -> None:
    for route in [
        route for route in app_api.routes if isinstance(route, fastapi.routing.APIRoute)
    ]:
        assert route.path in ALL_ENDPOINTS_APP, (
            f"Path {route.path} is not in any role list, please add it to one of"
            " the above lists, depending on its access restrictions"
        )


def test_all_edge_routes_listed(edge_api: fastapi.FastAPI) -> None:
    for route in [
        route
        for route in edge_api.routes
        if isinstance(route, fastapi.routing.APIRoute)
    ]:
        assert route.path in ALL_ENDPOINTS_EDGE, (
            f"Path {route.path} is not in any role list, please add it to one of"
            " the above lists, depending on its access restrictions"
        )


def test_routes_role_access(app_api: fastapi.FastAPI) -> None:
    for route in [
        route
        for route in app_api.routes
        if isinstance(route, fastapi.routing.APIRoute)
        and route.path not in PUBLIC_ENDPOINTS
    ]:
        _check_path(route)


RESTRICTED_APP_ENDPOINTS = (
    LIVE_ONLY_USER_GROUP_LOCATION_RESTRICTED_ENDPOINTS
    | LIMITED_USER_GROUP_LOCATION_RESTRICTED_ENDPOINTS
    | REGULAR_USER_GROUP_LOCATION_RESTRICTED_ENDPOINTS
)

UNRESTRICTED_APP_ENDPOINTS = (
    LIVE_ONLY_USER_UNRESTRICTED_ENDPOINTS
    | LIMITED_USER_UNRESTRICTED_ENDPOINTS
    | REGULAR_USER_UNRESTRICTED_ENDPOINTS
)


# NOTE(@lberg): for ADMIN it doesn't matter if the endpoint is restricted or not
# since they have access to everything


def test_routes_access_restrictions(app_api: fastapi.FastAPI) -> None:
    for route in [
        route
        for route in app_api.routes
        if isinstance(route, fastapi.routing.APIRoute)
        and route.path in RESTRICTED_APP_ENDPOINTS
    ]:
        _check_access_restrictions_path(route)


def test_routes_no_access_restrictions(app_api: fastapi.FastAPI) -> None:
    for route in [
        route
        for route in app_api.routes
        if isinstance(route, fastapi.routing.APIRoute)
        and route.path in UNRESTRICTED_APP_ENDPOINTS
    ]:
        _check_no_access_restrictions_path(route)
