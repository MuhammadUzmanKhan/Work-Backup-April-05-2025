from backend.monitor.models import (
    CameraResponseWithAlertStates,
    NVRResponseWithAlertStates,
)


def devices_status_change_alert_email_contents(
    offline_nvrs: list[NVRResponseWithAlertStates],
    down_nvrs_to_alert: list[NVRResponseWithAlertStates],
    up_nvrs_to_alert: list[NVRResponseWithAlertStates],
    down_cameras_to_alert: list[CameraResponseWithAlertStates],
    up_cameras_to_alert: list[CameraResponseWithAlertStates],
) -> str:
    """Generate the email contents for a device status change alert.

    :param offline_nvrs: all offline NVRs (note this is != down_nvrs_to_alert
        as the latter only contain NVRs that recently changed)
    :param down_nvrs_to_alert: NVRs who recently became unavailabe and
        should be alerted
    :param up_nvrs_to_alert: NVRs who recently became availabe and
        should be alerted
    :param down_cameras_to_alert: same as NVRs
    :param up_cameras_to_alert: same as NVRs

    :return: alert email contents"""
    email_contents = (
        "Our monitoring service discovered a change in system health.<br /><br />"
    )

    if len(down_nvrs_to_alert) > 0 or len(down_cameras_to_alert) > 0:
        email_contents += "The following devices became unavailable:<br /><br />"
        for nvr in down_nvrs_to_alert:
            email_contents += f"Appliance name: {nvr.uuid}<br />"
            email_contents += f"Location: {nvr.location_name}<br />"
            last_seen_time = "Unknown"
            if nvr.last_seen_time is not None:
                last_seen_time = (
                    nvr.last_seen_time.strftime("%Y-%m-%d %H:%M:%S") + " (UTC)"
                )
            email_contents += f"Last seen: {last_seen_time}<br /><br />"

        offline_nvr_uuids = {nvr.uuid for nvr in offline_nvrs}
        for camera in down_cameras_to_alert:
            # Note, we don't show "duplicate" alerts, i.e. NVR down implies camera down
            # (see comments in create_camera_alert_slack_messages).
            if camera.camera.nvr_uuid in offline_nvr_uuids:
                continue
            email_contents += f"Camera name: {camera.camera.name}<br />"
            email_contents += f"Location: {camera.location}<br /><br />"

    if len(up_nvrs_to_alert) > 0 or len(up_cameras_to_alert) > 0:
        email_contents += "The following devices became available:<br /><br />"
        for nvr in up_nvrs_to_alert:
            email_contents += f"Appliance name: {nvr.uuid}<br />"
            email_contents += f"Location: {nvr.location_name}<br />"

        recently_available_nvr_uuids = {nvr.uuid for nvr in up_nvrs_to_alert}
        for camera in up_cameras_to_alert:
            if camera.camera.nvr_uuid in recently_available_nvr_uuids:
                continue
            email_contents += f"Camera name: {camera.camera.name}<br />"
            email_contents += f"Location: {camera.location}<br /><br />"

    email_contents += "Best,<br />The Coram Team"
    return email_contents
