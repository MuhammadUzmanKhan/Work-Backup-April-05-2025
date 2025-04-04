import asyncio

from python_http_client.exceptions import HTTPError
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

CORAM_SUPPORT_EMAIL = "support@coram.ai"

SENDGRID_WELCOME_EMAIL_TEMPLATE_ID = "d-56662abec26e4fdd81c080dd591bb2d3"


PERSON_INTEREST_SUBJECT = "Coram AI: Person of interest alert"
LICENSE_PLATE_SUBJECT = "Coram AI: License plate of interest alert"

SHARED_VIDEO_EMAIL = """
{user_name} shared a new video with you.
Please click <a href="{coram_url}/video/{unique_hash}">here</a>
to view the video.
<br>
<br>
Location: {location_name}
<br>
Camera: {camera_name}
<br>
Begin time: {begin_time}
<br>
End time: {end_time}
<br>
{message_line}
<br>
The link will expire in {expiration_hour}h.
<br>
<br>
Best,
<br>
The Coram Team
"""


SHARE_LIVE_STREAM_EMAIL = """
{user_name} shared a live video feed with you.
Please click <a href="{coram_url}/live/{unique_hash}">here</a>
to view the video.
<br>
<br>
Location: {location_name}
<br>
Camera: {camera_name}
<br>
{message_line}
<br>
The link will expire in {expiration_hour}h.
<br>
<br>
Best,
<br>
The Coram Team
"""

ALERT_VIDEO_EMAIL = """
{user_name} shared a new video with you. Abnormal activity detected on:
<br>
<br>
Location: {location_name}
<br>
Group: {group_name}
<br>
Camera: {camera_name}
<br>
<br>

Please click <a href="{coram_url}/video/{unique_hash}">here</a>
to view the video.
The link will expire in {expiration_hour}h.
<br>
<br>
Best,
<br>
The Coram Team
"""

SHARED_WALL_EMAIL = """
A personal wall has been shared with you. You can log into Coram AI to see the
personal wall. To get access to the Coram AI dashboard, contact the admin.
Details below:
<br>
<br>
Sender: {sender}
<br>
<br>
Wall name: {wall_name}
"""

SHARED_ARCHIVE_EMAIL = """
An archive video has been shared with you. You can log into Coram AI to see the
archive. To get access to the Coram AI dashboard, contact the admin.
Details below:
<br>
<br>
Sender: {sender}
"""

SHARED_KIOSK_EMAIL = """
A kiosk has been shared with you. Please click <a
href="{coram_url}/k/{kiosk_hash}">here</a> to access the kiosk.
Details below:
<br>
<br>
Sender: {sender}
<br>
<br>
Kiosk name: {kiosk_name}
"""

POI_ALERT_EMAIL = """
A person of interest has been detected on:
<br>
<br>
Person name: {person_name}
<br>
Location: {location_name}
<br>
Group: {group_name}
<br>
Camera: {camera_name}
<br>
<br>

Please click <a href="{coram_url}/video/{unique_hash}">here</a>
to view the video.
The link will expire in {expiration_hour}h.
<br>
<br>
Best,
<br>
The Coram Team
"""

LPOI_ALERT_EMAIL = """
A license plate of interest has been detected on:
<br>
<br>
License plate number: {license_plate_number}
<br>
Location: {location_name}
<br>
Group: {group_name}
<br>
Camera: {camera_name}
<br>
<br>

Please click <a href="{coram_url}/video/{unique_hash}">here</a>
to view the video.
The link will expire in {expiration_hour}h.
<br>
<br>
Best,
<br>
The Coram Team
"""


class EmailException(Exception):
    pass


class EmailClient:
    sendgrid_client: SendGridAPIClient

    def __init__(self, sendgrid_api_key: str):
        self.sendgrid_client = SendGridAPIClient(sendgrid_api_key)

    async def send_html_email(
        self,
        *,
        recipients: list[str],
        subject: str,
        content: str,
        sender: str = CORAM_SUPPORT_EMAIL,
    ) -> None:
        message = Mail(
            from_email=sender,
            to_emails=recipients,
            subject=subject,
            html_content=content,
        )
        await self.send_email(message)

    # TODO: refactor usage to not pass in the Mail type outside of this file
    async def send_email(self, message: Mail) -> None:
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None, self.sendgrid_client.send, message
            )
            if response.status_code not in [200, 202]:
                raise EmailException(
                    f"Failed to send email {message}, got {response.status_code=},"
                    f" {response=}"
                )
        except HTTPError as exc:
            raise EmailException(f"Failed to send email {message}: {exc}")

    async def send_support_email(
        self, recipient: str, subject: str, content: str
    ) -> None:
        message = Mail(
            from_email=CORAM_SUPPORT_EMAIL,
            to_emails=recipient,
            subject=subject,
            html_content=content,
        )
        await self.send_email(message)


async def send_welcome_email(
    email_client: EmailClient, *, user_email: str, user_name: str, web_app_url: str
) -> None:
    """Send a welcome email to a new user."""
    message = Mail(from_email="noreply@coram.ai", to_emails=user_email)
    message.dynamic_template_data = {"name": user_name, "coram_ai_url": web_app_url}
    message.template_id = SENDGRID_WELCOME_EMAIL_TEMPLATE_ID

    await email_client.send_email(message)
