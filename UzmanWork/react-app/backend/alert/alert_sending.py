from datetime import timedelta

from pydantic import EmailStr

from backend.alert.constants import ALERT_USER_NAME
from backend.alert.models import SharedLiveStreamFormat, SharedVideoFormat, ShareMethod
from backend.email_sending import (
    ALERT_VIDEO_EMAIL,
    LPOI_ALERT_EMAIL,
    POI_ALERT_EMAIL,
    SHARE_LIVE_STREAM_EMAIL,
    SHARED_ARCHIVE_EMAIL,
    SHARED_KIOSK_EMAIL,
    SHARED_VIDEO_EMAIL,
    SHARED_WALL_EMAIL,
    EmailClient,
)
from backend.models import UserAlertWithStreamName
from backend.sms_sending import (
    ALERT_VIDEO_SMS,
    LPOI_ALERT_SMS,
    POI_ALERT_SMS,
    SHARED_LIVE_STREAM_SMS,
    SHARED_VIDEO_SMS,
    SMSClient,
    SMSException,
)

DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S"


def format_alert_video_message(
    user_alert: UserAlertWithStreamName,
    web_app_url: str,
    unique_shared_video_hash: str,
    expiration_dur: timedelta,
    email: bool = False,
) -> str:
    """Format the message to send to the user about the alert video.

    :param user_alert: the object that contains the detailed info on the alert
    :param web_app_url: the url of the web app
    :param unique_shared_video_hash: the unique hash of the shared video
    :param email: whether to format the message for email or sms, defaults to False
    """
    template = ALERT_VIDEO_EMAIL if email else ALERT_VIDEO_SMS
    message = template.format(
        user_name=ALERT_USER_NAME,
        location_name=user_alert.location_name,
        group_name=user_alert.group_name,
        camera_name=user_alert.camera_name,
        coram_url=web_app_url,
        unique_hash=unique_shared_video_hash,
        # Round to nearest hour
        expiration_hour=round(expiration_dur.total_seconds() / 3600),
    )

    return message


def format_shared_video_message(
    web_app_url: str, user_name: str, share_data: SharedVideoFormat
) -> str:
    """Format the message to send to the user about the shared video."""
    template = (
        SHARED_VIDEO_EMAIL
        if share_data.share_method == ShareMethod.Email
        else SHARED_VIDEO_SMS
    )
    start_time_str = f"{share_data.start_time.strftime(DATETIME_FORMAT)}"
    f"  ({share_data.timezone_name})"
    end_time_str = f"{share_data.end_time.strftime(DATETIME_FORMAT)}"
    f"  ({share_data.timezone_name})"
    message_line = (
        f"Message: {share_data.message}" if share_data.message is not None else ""
    )
    shared_video_message = template.format(
        user_name=user_name,
        coram_url=web_app_url,
        unique_hash=share_data.unique_shared_video_hash,
        location_name=share_data.location_name,
        camera_name=share_data.camera_name,
        begin_time=start_time_str,
        end_time=end_time_str,
        message_line=message_line,
        # Round to nearest hour
        expiration_hour=round(share_data.expiration_dur.total_seconds() / 3600),
    )
    return shared_video_message


def format_shared_live_stream_message(
    web_app_url: str, user_name: str, share_data: SharedLiveStreamFormat
) -> str:
    """Format the message to send to the user about the shared video."""
    template = (
        SHARE_LIVE_STREAM_EMAIL
        if share_data.share_method == ShareMethod.Email
        else SHARED_LIVE_STREAM_SMS
    )
    message_line = (
        f"Message: {share_data.message}" if share_data.message is not None else ""
    )
    shared_video_message = template.format(
        user_name=user_name,
        coram_url=web_app_url,
        unique_hash=share_data.unique_shared_video_hash,
        location_name=share_data.location_name,
        camera_name=share_data.camera_name,
        message_line=message_line,
        # Round to nearest hour
        expiration_hour=round(share_data.expiration_dur.total_seconds() / 3600),
    )
    return shared_video_message


def format_shared_wall_message(sender: EmailStr | None, wall_name: str) -> str:
    return SHARED_WALL_EMAIL.format(
        sender=sender if sender else "", wall_name=wall_name
    )


def format_shared_archive_message(sender: str) -> str:
    return SHARED_ARCHIVE_EMAIL.format(sender=sender if sender else "")


# TODO (balazs): Clean up email types (use EmailStr where possible)
def format_shared_kiosk_message(
    web_app_url: str, sender: str, kiosk_name: str, kiosk_hash: str
) -> str:
    return SHARED_KIOSK_EMAIL.format(
        coram_url=web_app_url,
        sender=sender,
        kiosk_name=kiosk_name,
        kiosk_hash=kiosk_hash,
    )


def format_poi_alert_message(
    person_name: str,
    location_name: str | None,
    group_name: str,
    camera_name: str,
    web_app_url: str,
    unique_shared_video_hash: str,
    expiration_dur: timedelta,
    email: bool = False,
) -> str:
    template = POI_ALERT_EMAIL if email else POI_ALERT_SMS
    message = template.format(
        person_name=person_name,
        location_name=location_name,
        group_name=group_name,
        camera_name=camera_name,
        coram_url=web_app_url,
        unique_hash=unique_shared_video_hash,
        # Round to nearest hour
        expiration_hour=round(expiration_dur.total_seconds() / 3600),
    )
    return message


def format_lpoi_alert_message(
    license_plate_number: str,
    location_name: str | None,
    group_name: str,
    camera_name: str,
    web_app_url: str,
    unique_shared_video_hash: str,
    expiration_dur: timedelta,
    email: bool = False,
) -> str:
    template = LPOI_ALERT_EMAIL if email else LPOI_ALERT_SMS
    message = template.format(
        license_plate_number=license_plate_number,
        location_name=location_name,
        group_name=group_name,
        camera_name=camera_name,
        coram_url=web_app_url,
        unique_hash=unique_shared_video_hash,
        # Round to nearest hour
        expiration_hour=round(expiration_dur.total_seconds() / 3600),
    )
    return message


async def send_shared_video_email(
    email_client: EmailClient, content: str, email_address: str, user_name: str
) -> None:
    """Send an email to the user about the shared video."""
    await email_client.send_support_email(
        recipient=email_address,
        subject=f"{user_name} shared a new video with you",
        content=content,
    )


async def send_shared_live_stream_email(
    email_client: EmailClient, content: str, email_address: str, user_name: str
) -> None:
    """Send an email to the user about the live stream."""
    await email_client.send_support_email(
        recipient=email_address,
        subject=f"{user_name} shared a live video feed with you",
        content=content,
    )


async def send_shared_wall_email(
    email_client: EmailClient, recipient: str, content: str
) -> None:
    await email_client.send_support_email(
        recipient=recipient,
        subject="Coram AI: A personal wall has been shared with you",
        content=content,
    )


async def send_shared_archive_email(
    email_client: EmailClient, recipient: str, content: str
) -> None:
    await email_client.send_support_email(
        recipient=recipient,
        subject="Coram AI: An archive video has been shared with you",
        content=content,
    )


async def send_shared_kiosk_email(
    email_client: EmailClient, recipient: str, content: str
) -> None:
    await email_client.send_support_email(
        recipient=recipient,
        subject="Coram AI: A kiosk has been shared with you",
        content=content,
    )


async def send_analytics_alert_email(
    email_client: EmailClient, recipient: str, content: str, subject: str
) -> None:
    await email_client.send_support_email(
        recipient=recipient, subject=subject, content=content
    )


async def send_sms(sms_client: SMSClient, content: str, phone_number: str) -> None:
    """Send an SMS to the user about the shared video.

    :param sms_client: SMSClient instance
    :param content: the message content for the SMS
    :param phone_number: the phone number of the user
    """
    if phone_number is None:
        raise SMSException("Phone number required to send sms")

    await sms_client.send_sms([phone_number], content)
