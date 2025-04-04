from typing import Any, Callable, Optional

import fastapi
import fastapi.dependencies.models
import fastapi.params

from backend.access_logs.utils import AccessLogger
from backend.kinesis_api.constants import (
    HLS_MASTER_PLAYLIST_ROUTE,
    HLS_MEDIA_PLAYLIST_ROUTE,
)
from backend.test.endpoint_key import EndpointKey

ENDPOINTS_WITH_LOGGER = {
    EndpointKey.Delete("/archive/{archive_id}"),
    EndpointKey.Delete("/dashboard/{dashboard_id}"),
    EndpointKey.Delete("/devices/delete_camera_group"),
    EndpointKey.Delete("/devices/delete_location/{location_id}"),
    EndpointKey.Delete("/license_plate_alert/delete_alert_profile/{alert_profile_id}"),
    EndpointKey.Delete("/members/delete"),
    EndpointKey.Delete("/members/permanently_delete_own_user"),
    EndpointKey.Delete("/organization_alert_subscribers/remove"),
    EndpointKey.Delete("/user_wall/delete_wall/{wall_id}"),
    EndpointKey.Post("/access_control/access_points/actions/unlock"),
    EndpointKey.Post("/archive/"),
    EndpointKey.Post("/archive/add_clip/{archive_id}"),
    EndpointKey.Post("/archive/share"),
    EndpointKey.Post("/archive/unshare/{archive_id}"),
    EndpointKey.Post("/archive/update_description/{archive_id}"),
    EndpointKey.Post("/dashboard/"),
    EndpointKey.Post("/devices/cameras_export"),
    EndpointKey.Post("/devices/create_group"),
    EndpointKey.Post("/devices/create_location"),
    EndpointKey.Post("/devices/delete_camera"),
    EndpointKey.Post("/devices/disable_camera"),
    EndpointKey.Post("/devices/enable_camera"),
    EndpointKey.Post("/devices/nvrs_export"),
    EndpointKey.Post("/devices/register_nvr"),
    EndpointKey.Post("/devices/rename_camera"),
    EndpointKey.Post("/devices/update_camera_credentials"),
    EndpointKey.Post("/devices/update_camera_flag"),
    EndpointKey.Post("/devices/update_camera_group"),
    EndpointKey.Post("/devices/update_camera_rtsp_url"),
    EndpointKey.Post("/devices/update_camera_video_orientation_type"),
    EndpointKey.Post("/devices/update_location_address"),
    EndpointKey.Post("/devices/update_location_enable_setting_timezone"),
    EndpointKey.Post("/devices/update_location_name"),
    EndpointKey.Post("/devices/update_location_timezone"),
    EndpointKey.Post("/devices/update_nvr_location"),
    EndpointKey.Post("/kinesis_api/get_clip_upload_request"),
    EndpointKey.Post("/kinesis_api/s3_upload_and_fetch"),
    EndpointKey.Post("/license_plate_alert/add_alert_profile"),
    EndpointKey.Post("/members/create"),
    EndpointKey.Post("/members/update_user_access_restrictions"),
    EndpointKey.Post("/members/update_user_name"),
    EndpointKey.Post("/members/update_user_role"),
    EndpointKey.Post("/org_flags/update_org_flag"),
    EndpointKey.Post("/organization_alert_subscribers/add"),
    EndpointKey.Post("/organizations/update_audio_settings"),
    EndpointKey.Post("/organizations/update_inactive_user_logout"),
    EndpointKey.Post("/organizations/update_low_res_bitrate"),
    EndpointKey.Post("/organizations/update_network_scan_settings"),
    EndpointKey.Post("/organizations/update_number_licensed_cameras"),
    EndpointKey.Post("/organizations/update_webrtc_settings"),
    EndpointKey.Post("/shared_videos/"),
    EndpointKey.Post("/shared_videos/live"),
    EndpointKey.Post("/user_alerts/create"),
    EndpointKey.Post("/user_alerts/delete"),
    EndpointKey.Post("/user_alerts/update_setting_name"),
    EndpointKey.Post("/user_alerts/update"),
    EndpointKey.Post("/user_wall/copy_wall"),
    EndpointKey.Post("/user_wall/create_wall"),
    EndpointKey.Post("/user_wall/edit_tiles/{wall_id}"),
    EndpointKey.Post("/user_wall/rename_wall"),
    EndpointKey.Post("/user_wall/share_wall"),
    EndpointKey.Post("/user_wall/unshare_wall"),
    EndpointKey.Delete("/access_control/integrations/{vendor}"),
    EndpointKey.Delete("/dashboard/reports/{report_id}"),
    EndpointKey.Post("/dashboard/reports/{report_id}/actions/clone"),
    EndpointKey.Post("/face/face_occurrences"),
    EndpointKey.Post("/face/upload_face_picture"),
    EndpointKey.Post("/face_alert/update_notification_groups/{alert_profile_id}"),
    EndpointKey.Post("/face_alert/register_alert_profile"),
    EndpointKey.Post("/face_alert/update_profile_description/{alert_profile_id}"),
    EndpointKey.Post("/face_alert/update_person_of_interest_flag/{alert_profile_id}"),
    EndpointKey.Delete("/face_alert/delete_alert_profile/{alert_profile_id}"),
    EndpointKey.Patch("/dashboard/"),
    EndpointKey.Post("/dashboard/reports/"),
    EndpointKey.Post("/kiosk/create"),
    EndpointKey.Post("/kiosk/regenerate/{kiosk_id}"),
    EndpointKey.Post("/kiosk/rename"),
    EndpointKey.Post("/kiosk/share"),
    EndpointKey.Post("/kiosk/update_status"),
    EndpointKey.Post("/kiosk/update_walls"),
    EndpointKey.Post("/text_search/assistant"),
    EndpointKey.Post("/text_search/multi_camera_search"),
    EndpointKey.Post("/text_search/single_camera_search"),
    EndpointKey.Post("/text_search/perform_multi_camera_search"),
    EndpointKey.Post("/text_search/perform_single_camera_search"),
    EndpointKey.Post("/face_alert/alert_occurrences/{alert_profile_id}"),
    EndpointKey.Post("/face_alert/alert_profile"),
    EndpointKey.Post("/face_alert/latest_person_of_interest_alert_occurrences"),
    EndpointKey.Post("/archive/{archive_id}/tags"),
    EndpointKey.Post("/archive/comment"),
    EndpointKey.Post("/archive/update_title/{archive_id}"),
    EndpointKey.Post("/cameras_registration/register_candidates/{location_id}"),
    EndpointKey.Post("/notification_group/new_group_member"),
    EndpointKey.Post("/notification_group/rename_group/{group_id}"),
    EndpointKey.Post("/notification_group/update_group_member/{group_member_id}"),
    EndpointKey.Post(
        "/license_plate_alert/update_notification_groups/{alert_profile_id}"
    ),
    EndpointKey.Post("/access_control/assign_camera"),
    EndpointKey.Post("/access_control/unassign_camera"),
    EndpointKey.Delete("/notification_group/delete_group_member/{group_member_id}"),
    EndpointKey.Delete("/kiosk/delete/{kiosk_id}"),
    EndpointKey.Delete("/notification_group/delete_group/{group_id}"),
    EndpointKey.Post("/admin/organisations/update_always_on_retention"),
    EndpointKey.Post("/admin/nvrs/update_retention"),
    EndpointKey.Post("/admin/nvrs/lock_nvr_slots"),
    EndpointKey.Post("/admin/nvrs/unlock_nvr_slots"),
    EndpointKey.Post("/admin/nvrs/{nvr_uuid}/unassign"),
}

ENDPOINTS_WITHOUT_LOGGER = {
    EndpointKey.Get("/access_control/authorize_brivo"),
    EndpointKey.Get("/access_control/brivo/get-api-key"),
    EndpointKey.Get("/access_control/list_access_points"),
    EndpointKey.Get("/access_control/list_integrations"),
    EndpointKey.Get("/archive/{archive_id}/clip/{clip_id}/thumbnails"),
    EndpointKey.Get("/archive/{archive_id}/comments"),
    EndpointKey.Get("/archive/summary"),
    EndpointKey.Get("/archive/user_archives"),
    EndpointKey.Get("/cameras_registration/candidate_cameras/{location_id}"),
    EndpointKey.Get("/cameras"),
    EndpointKey.Get("/cameras/"),
    EndpointKey.Get("/cameras/{camera_id}"),
    EndpointKey.Get("/cameras/downtime/{camera_id}"),
    EndpointKey.Get("/dashboard/{dashboard_id}"),
    EndpointKey.Get("/dashboard/reports/data/{report_id}"),
    EndpointKey.Get("/dashboard/summary"),
    EndpointKey.Get("/devices/get_recent_camera_pipeline_alerts"),
    EndpointKey.Get("/devices/nvrs"),
    EndpointKey.Get("/devices/validate_nvr"),
    EndpointKey.Get("/face_alert/alert_profiles"),
    EndpointKey.Get("/features"),
    EndpointKey.Get("/groups_with_location"),
    EndpointKey.Get("/groups"),
    EndpointKey.Get("/kiosk_public/{kiosk_hash}"),
    EndpointKey.Get("/kiosk/"),
    EndpointKey.Get("/license_plate_alert/profile_exists/{license_plate_number}"),
    EndpointKey.Get("/locations"),
    EndpointKey.Get("/members/list"),
    EndpointKey.Get("/monitor/backend_health"),
    EndpointKey.Get("/monitor/db_health"),
    EndpointKey.Get("/notification_group/"),
    EndpointKey.Get("/notification_group/new_group"),
    EndpointKey.Get("/org_flags/get_org_flag"),
    EndpointKey.Get("/organization_alert_subscribers/list"),
    EndpointKey.Get("/organizations"),
    EndpointKey.Get("/organizations/retrieve_network_scan_settings"),
    EndpointKey.Get("/organizations/retrieve_number_licensed_cameras"),
    EndpointKey.Get("/retention_management/enforce_retention_detection_events"),
    EndpointKey.Get("/retention_management/enforce_retention_face_occurrences"),
    EndpointKey.Get("/retention_management/enforce_retention_mct_images"),
    EndpointKey.Get("/retention_management/enforce_retention_thumbnails"),
    EndpointKey.Get("/shared_videos_public/download/{unique_hash}"),
    EndpointKey.Get("/shared_videos_public/exchange/{unique_hash}"),
    EndpointKey.Get("/shared_videos_public/info/{unique_hash}"),
    EndpointKey.Get("/shared_videos_public/info/live/{unique_uuid}"),
    EndpointKey.Get("/tags/"),
    EndpointKey.Get("/user_alerts/alert_settings"),
    EndpointKey.Get("/user_alerts/alerts"),
    EndpointKey.Get("/user_wall/"),
    EndpointKey.Get("/user_wall/count"),
    EndpointKey.Get("/user_wall/is_used_in_kiosk"),
    EndpointKey.Get("/user_wall/tiles/{wall_id}"),
    EndpointKey.Get("/versioning/check_frontend_requires_update"),
    EndpointKey.Get(f"/kinesis_api_public/{HLS_MASTER_PLAYLIST_ROUTE}"),
    EndpointKey.Get(f"/kinesis_api_public/{HLS_MEDIA_PLAYLIST_ROUTE}"),
    EndpointKey.Patch("/dashboard/{dashboard_id}/reports-order"),
    EndpointKey.Post("/access_control/authorize_alta"),
    EndpointKey.Post("/access_control/brivo/set-api-key"),
    EndpointKey.Post("/access_control/list_events"),
    EndpointKey.Post("/access_control/set_favorite_camera"),
    EndpointKey.Post("/access_control/set_location"),
    EndpointKey.Post("/archive/clip"),
    EndpointKey.Post("/dashboard/reports/actions/data/preview"),
    EndpointKey.Post("/dashboard/update_user_favorite"),
    EndpointKey.Post("/devices/get_camera_pipeline_alerts"),
    EndpointKey.Post("/devices/update_webrtc_bulk_flag"),
    EndpointKey.Post("/face/track_thumbnail_from_face_occurrence"),
    EndpointKey.Post("/face/unique_faces"),
    EndpointKey.Post("/journey/journey_from_track"),
    EndpointKey.Post("/journey/retrieve_tracks_thumbnail"),
    EndpointKey.Post("/kinesis_api_public/sign_webrtc_request"),
    EndpointKey.Post("/kinesis_api/abort_clip_upload"),
    EndpointKey.Post("/kinesis_api/clip"),
    EndpointKey.Post("/kinesis_api/live_data"),
    EndpointKey.Post("/kinesis_api/request_live"),
    EndpointKey.Post("/kiosk_public/{kiosk_hash}/keep_wall_alive"),
    EndpointKey.Post("/kiosk_public/{kiosk_hash}/live_data_kiosk"),
    EndpointKey.Post("/kiosk_public/{kiosk_hash}/next_wall"),
    EndpointKey.Post("/license_plate/license_plate_occurrences"),
    EndpointKey.Post("/license_plate/license_plates"),
    EndpointKey.Post("/monitor/video_stream_alert"),
    EndpointKey.Post("/organizations/access_logs"),
    EndpointKey.Post("/organizations/create_organization"),
    EndpointKey.Post("/perceptions/aggregate"),
    EndpointKey.Post("/perceptions/analytics_query"),
    EndpointKey.Post("/shared_videos_public/exchange/live/{unique_uuid}"),
    EndpointKey.Post("/shared_videos_public/live/keep_alive/{unique_uuid}"),
    EndpointKey.Post("/tags/"),
    EndpointKey.Post("/thumbnail/most_recent_thumbnail_enlarged"),
    EndpointKey.Post("/thumbnail/most_recent_thumbnails"),
    EndpointKey.Post("/thumbnail/query_thumbnails_range"),
    EndpointKey.Post("/thumbnail/query_thumbnails_timestamps"),
    EndpointKey.Post("/thumbnail/timelapse"),
    EndpointKey.Put("/dashboard/reports/{report_id}"),
    EndpointKey.Get("/admin/nvrs"),
    EndpointKey.Get("/admin/organisations"),
    EndpointKey.Get("/admin/cameras"),
    EndpointKey.Get("/admin/nvrs/{nvr_uuid}/is_nvr_slots_locked"),
}


ALL_ENDPOINTS_APP = ENDPOINTS_WITH_LOGGER | ENDPOINTS_WITHOUT_LOGGER


DependencyType = Optional[Callable[..., Any]]


def _find_access_logger(route: fastapi.routing.APIRoute) -> bool:
    for dep in route.dependant.dependencies:
        if isinstance(dep.call, AccessLogger):
            return True
    return False


def test_all_app_routes_listed_for_access_logs(app_api: fastapi.FastAPI) -> None:
    app_paths = {
        EndpointKey(path=route.path, methods=route.methods)
        for route in app_api.routes
        if isinstance(route, fastapi.routing.APIRoute)
    }
    assert app_paths == ALL_ENDPOINTS_APP, (
        "Paths in app do not match the expected paths."
        f"Missing: {ALL_ENDPOINTS_APP - app_paths}"
        f" Extra: {app_paths - ALL_ENDPOINTS_APP}. Please update the lists,"
        "depending on whether it requires a logger or not "
    )


def test_routes_access_logger(app_api: fastapi.FastAPI) -> None:
    logs = []
    for route in [
        route for route in app_api.routes if isinstance(route, fastapi.routing.APIRoute)
    ]:
        endpoint_key = EndpointKey(path=route.path, methods=route.methods)
        if endpoint_key in ENDPOINTS_WITH_LOGGER and not _find_access_logger(route):
            logs.append(f"Access logger not found for route {endpoint_key}")

        elif endpoint_key in ENDPOINTS_WITHOUT_LOGGER and _find_access_logger(route):
            logs.append(
                f"Access logger found for route {endpoint_key}"
                " but it should not have one"
            )
    if logs:
        raise AssertionError("\n".join(logs))
