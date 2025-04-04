import asyncio
import logging
import random
from datetime import datetime, timedelta
from typing import Sequence, cast

from pydantic import BaseModel
from slack_sdk.errors import SlackApiError
from slack_sdk.web.async_client import AsyncWebClient

from backend import logging_config
from backend.monitor.alert import (
    Alert,
    AlertGrouped,
    AlertNVR,
    AlertOrgGrouped,
    AlertSeverity,
    AlertTypeGrouped,
)
from backend.monitor.alert_types import AlertType
from backend.utils import AwareDatetime

logger = logging.getLogger(logging_config.LOGGER_NAME)


# How long to search for a message to continue the thread from
GROUP_MESSAGE_SEARCH_WINDOW = timedelta(hours=2)


class MsgGroupCacheItem(BaseModel):
    msg_id: str
    created_time: AwareDatetime


class SlackClient:
    """
    Implements a Slack client that can be used to send messages to a Slack
    channel.

    We currently use this to send alerts to a Slack channel. We group alerts
    by NVRs by creating a new message for each NVR and then continuing the
    thread of that message for each alert. This way we can easily see all
    alerts for a specific NVR in a single thread.
    """

    _slack_client: AsyncWebClient
    # Cache of (channel, nvr_uuid) -> message_id, so we need to ping the slack
    # API less and as as result it is harder to get rate limited.
    _msg_group_cache: dict[str, MsgGroupCacheItem] = {}

    def __init__(
        self,
        error_alert_slack_channel: str,
        warning_alert_slack_channel: str,
        info_alert_slack_channel: str,
        slack_app_id: str,
        slack_app_token: str,
    ):
        self._slack_client = AsyncWebClient(token=slack_app_token)
        self._slack_app_id = slack_app_id
        self._error_alert_slack_channel = error_alert_slack_channel
        self._warning_alert_slack_channel = warning_alert_slack_channel
        self._info_alert_slack_channel = info_alert_slack_channel

    async def send_alert(self, alert: Alert, channel: str | None = None) -> None:
        """Sends an alert formatted as blocks of text to a Slack channel"""
        if channel is None:
            # Figure out the channel based on severity
            channel = {
                AlertSeverity.CRITICAL: self._error_alert_slack_channel,
                AlertSeverity.ERROR: self._error_alert_slack_channel,
                AlertSeverity.WARNING: self._warning_alert_slack_channel,
                AlertSeverity.INFO: self._info_alert_slack_channel,
            }.get(alert.alert_severity, self._info_alert_slack_channel)
        # Add a random sleep here to avoid multiple alerts firing at the same
        # time, circumventing batching into threads.
        await asyncio.sleep(random.uniform(0, 0.5))

        if isinstance(alert, AlertNVR):
            await self._send_nvr_alert(alert, channel)
        elif isinstance(alert, AlertOrgGrouped):
            await self._send_org_grouped_alert(alert, channel)
        elif isinstance(alert, AlertTypeGrouped):
            await self._send_type_grouped_alert(alert, channel)
        else:
            await self._send_alert_detailed_msg(
                alert=alert, channel=channel, group_msg_id=None
            )

    async def _send_nvr_alert(self, alert: AlertNVR, channel: str) -> None:
        msg_group_cache_key = f"AlertNVR-{channel}-{alert.nvr_uuid}"
        await self._send_grouped_alert(alert, channel, msg_group_cache_key)

    async def _send_org_grouped_alert(
        self, alert: AlertOrgGrouped, channel: str
    ) -> None:
        msg_group_cache_key = f"AlertOrgGrouped-{channel}-{alert.org_name}"
        await self._send_grouped_alert(alert, channel, msg_group_cache_key)

    async def _send_type_grouped_alert(
        self, alert: AlertTypeGrouped, channel: str
    ) -> None:
        msg_group_cache_key = f"AlertTypeGrouped-{channel}-{alert.alert_type.value}"
        await self._send_grouped_alert(alert, channel, msg_group_cache_key)

    async def _send_grouped_alert(
        self, alert: AlertGrouped, channel: str, msg_group_cache_key: str
    ) -> None:
        now = AwareDatetime.utcnow()
        # Check if we have a cached message to continue the thread from
        group_msg_id = None
        if (
            msg_group_cache_key in self._msg_group_cache
            and (now - self._msg_group_cache[msg_group_cache_key].created_time)
            < GROUP_MESSAGE_SEARCH_WINDOW
        ):
            group_msg_id = self._msg_group_cache[msg_group_cache_key].msg_id
        else:
            # Try to find a message to continue the thread from. We do this
            # only for recent messages.
            group_msg_id = await self._find_msg_to_group_to(
                channel=channel,
                search_start_time=now - GROUP_MESSAGE_SEARCH_WINDOW,
                alert_group_text=alert.get_alert_group_text(),
            )

            # If we haven't found a message to continue the thread from, we send a
            # new message to start a new group.
            if group_msg_id is None:
                group_msg_id = await self._send_alert_new_group(
                    alert=alert, channel=channel
                )
                logger.info(f"Created new message to group to: {group_msg_id}")

            # Cache the message ID so we don't need to search for it again
            if group_msg_id is not None:
                self._msg_group_cache[msg_group_cache_key] = MsgGroupCacheItem(
                    msg_id=group_msg_id, created_time=now
                )

        await self._send_alert_detailed_msg(
            alert=alert, channel=channel, group_msg_id=group_msg_id
        )

    async def _send_alert_detailed_msg(
        self, alert: Alert, channel: str, group_msg_id: str | None
    ) -> None:
        """Send a detailed message about an alert to into a thread specified by
        `group_msg_id`. If `group_msg_id` is None, a new thread is created.
        """
        try:
            # Note: for now we ignore the response, but it might be useful later
            # if we want to continue the thread of the first message
            await self._slack_client.chat_postMessage(
                channel=channel,
                thread_ts=group_msg_id,
                blocks=[
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": (
                                f"*Type*: `{alert.alert_type.value}`\n"
                                f"*Event time*: `{alert.timestamp.isoformat()}`"
                            ),
                        },
                    },
                    {"type": "divider"},
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": self._get_detailed_info_markdown(
                                alert.detailed_info
                            ),
                        },
                    },
                ],
                text=(
                    f"Backend alert: {alert.alert_type}. Details could not be rendered."
                ),
            )
        except SlackApiError as e:
            logger.error(f"Error sending message to Slack: {repr(e)}")

    async def _send_alert_new_group(
        self, alert: AlertGrouped, channel: str
    ) -> str | None:
        """Sends a message to a channel to group an alert to."""
        try:
            group_msg_info = [
                f"- *{key}*: `{value}`"
                for key, value in [*sorted(alert.group_msg_info.items())]
            ]
            group_msg_info_markdown = "\n".join(group_msg_info)

            response = await self._slack_client.chat_postMessage(
                channel=channel,
                blocks=[
                    {
                        "type": "header",
                        "text": {"type": "plain_text", "text": ":alert: Backend alert"},
                    },
                    {"type": "divider"},
                    {
                        "type": "section",
                        "text": {"type": "mrkdwn", "text": group_msg_info_markdown},
                    },
                ],
                # It's important to set the text here, because we use the
                # content of this message to find the message to group to later.
                text=alert.get_alert_group_text(),
            )

            return cast(str, response["ts"])
        except SlackApiError as e:
            logger.error(f"Error sending message to Slack: {repr(e)}")

        return None

    async def _find_msg_to_group_to(
        self, channel: str, search_start_time: datetime, alert_group_text: str
    ) -> str | None:
        """Finds the message to group an alert to.

        :param channel: Slack channel to search in.
        :param search_start_time: Time to start searching from.
        :param alert_group_text: Text to check for in the message to group to.

        :return: Timestamp (ID) of the message to group the alert to, or None if
        no message was found within the search window.
        """

        try:
            # Get channel ID from channel name
            # TODO: Right now we ignore pagination, and we assume that the
            # channel we are looking for is in the first 200 channels. This
            # should be fine for now, but we should fix this in the future.
            response = await self._slack_client.conversations_list(
                exclude_archived=True, types="public_channel", limit=200
            )

            channel_id = None
            for channel_info in response["channels"]:
                if channel_info["name"] == channel:
                    channel_id = channel_info["id"]
                    break

            if channel_id is None:
                logger.error(f"Could not find channel ID for channel {channel}")
                return None

            # Find the last message that was sent by the Coram Backend Alert
            # slack app and that contains the NVR UUID
            response = await self._slack_client.conversations_history(
                channel=channel_id, oldest=str(search_start_time.timestamp()), limit=100
            )

            # Note that messages were returned in newest to oldest order, so the
            # first message we find is the one we want
            for message in response["messages"]:
                if (
                    "app_id" in message
                    and message["app_id"] == self._slack_app_id
                    and alert_group_text in message["text"]
                ):
                    return cast(str, message["ts"])

        except SlackApiError as e:
            logger.error(f"Error searching for message to group alert to: {repr(e)}")

        return None

    def _get_detailed_info_markdown(self, detailed_info: dict[str, str]) -> str:
        detailed_info_s = []
        for key, value in sorted(detailed_info.items()):
            # Truncate values that are too long or slack will drop the message
            if len(value) > 2000:
                value = value[:2000] + "..."
            detailed_info_s.append(f"- *{key}*: `{value}`")
        return "\n".join(detailed_info_s)


async def send_slack_alert_for_errors(
    errors: Sequence[Exception],
    alert_type: AlertType,
    alert_severity: AlertSeverity,
    slack_client: SlackClient,
    resource_description: str,
    org_name: str | None,
) -> None:
    """Utils function to send a sample of errors to slack and log all errors."""
    errors_str = [str(error) for error in errors]
    error_msg = "\n".join(errors_str)

    logger.error(f"Error for resource {resource_description}: {error_msg}")

    detailed_info = {
        "type": alert_type.value,
        "message": (
            f"Error for resource {resource_description} with"
            f" {len(errors)} errors. See logs for details, an error sample"
            " follow:\n" + "\n".join(errors_str[:5])
        ),
    }

    if org_name is not None:
        await slack_client.send_alert(
            AlertOrgGrouped(
                alert_type=alert_type,
                alert_severity=alert_severity,
                org_name=org_name,
                detailed_info=detailed_info,
            )
        )
    else:
        await slack_client.send_alert(
            AlertTypeGrouped(
                alert_type=alert_type,
                alert_severity=alert_severity,
                detailed_info=detailed_info,
            )
        )
