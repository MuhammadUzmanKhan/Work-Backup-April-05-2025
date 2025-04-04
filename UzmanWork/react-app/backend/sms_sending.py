from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client

SHARED_VIDEO_SMS = """
{user_name} shared a new video with you.
Please click the following link to view the video:

{coram_url}/video/{unique_hash}

Location: {location_name}
Camera: {camera_name}
Begin time: {begin_time}
End time: {end_time}
{message_line}

The link will expire in {expiration_hour}h.
"""

SHARED_LIVE_STREAM_SMS = """
{user_name} shared a live video feed with you.
Please click the following link to view the video:

{coram_url}/live/{unique_hash}

Location: {location_name}
Camera: {camera_name}
{message_line}

The link will expire in {expiration_hour}h.
"""


ALERT_VIDEO_SMS = """
{user_name} shared a new video with you. Abnormal activity detected on:

Location: {location_name}
Group: {group_name}
Camera: {camera_name}

Please click the following link to view the video:

{coram_url}/video/{unique_hash}

The link will expire in {expiration_hour}h.
"""

POI_ALERT_SMS = """
A person of interest has been detected on:

Person name: {person_name}
Location: {location_name}
Group: {group_name}
Camera: {camera_name}

Please click the following link to view the video:

{coram_url}/video/{unique_hash}

The link will expire in {expiration_hour}h.
"""

LPOI_ALERT_SMS = """
A license plate of interest has been detected on:

License plate number: {license_plate_number}
Location: {location_name}
Group: {group_name}
Camera: {camera_name}

Please click the following link to view the video:

{coram_url}/video/{unique_hash}

The link will expire in {expiration_hour}h.
"""


class SMSException(Exception):
    pass


class SMSClient:
    def __init__(self, account_sid: str, auth_token: str, from_number: str) -> None:
        self.client = Client(account_sid, auth_token)
        self.from_number = from_number

    async def send_sms(self, recipients: list[str], message: str) -> None:
        """Send and sms to the given number with the given message.

        :param to_number: Target number
        :param message: Text message
        """
        try:
            self.client.messages.create(
                to=recipients, from_=self.from_number, body=message
            )
        except TwilioRestException as e:
            raise SMSException(f"Error sending SMS: {e}")
