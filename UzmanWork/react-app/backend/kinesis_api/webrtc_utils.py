import random
import string

from botocore.exceptions import ClientError, ParamValidationError

from backend.boto_utils import BotoSessionFn
from backend.kinesis_api.errors import (
    KinesisWebRtcChannelError,
    KinesisWebRtcEndpointError,
    KinesisWebRtcIceConfigError,
    KinesisWebRtcNoIceServersError,
)
from backend.kinesis_api.models import (
    IceServerData,
    KinesisVideoLiveConfig,
    WebRtcChannelInfo,
    WebRtcData,
)
from backend.sync_utils import run_async


def get_random_client_id() -> str:
    """Generate a random client ID for the WebRTC connection.
    Each viewer must have a unique client ID."""
    return "client_" + "".join(random.choices(string.ascii_lowercase, k=5))


def get_webrtc_channel_info(
    boto_session_maker: BotoSessionFn, channel_name: str
) -> WebRtcChannelInfo:
    """Get information about the WebRTC channel from AWS.
    Fails if the channel does not exist.
    """
    try:
        boto_session = boto_session_maker()
        kinesis_video_client = boto_session.client("kinesisvideo")
        # Get the channel ARN from AWS
        describe_signaling_channel_response = (
            kinesis_video_client.describe_signaling_channel(ChannelName=channel_name)
        )
    except (ClientError, ParamValidationError) as ex:
        raise KinesisWebRtcChannelError(
            f"Failed to describe {channel_name=} with {ex=}"
        )

    channel_info = describe_signaling_channel_response.get("ChannelInfo")
    if not channel_info:
        raise KinesisWebRtcChannelError("Channel Info does not exist")

    channel_arn = channel_info.get("ChannelARN")
    if not channel_arn:
        raise KinesisWebRtcChannelError("Channel ARN does not exist")

    try:
        # Get the signaling channel endpoints for WSS and HTTPS
        signaling_channel_endpoint_response = (
            kinesis_video_client.get_signaling_channel_endpoint(
                ChannelARN=channel_arn,
                SingleMasterChannelEndpointConfiguration={
                    "Protocols": ["WSS", "HTTPS"],
                    "Role": "VIEWER",
                },
            )
        )
    except (ClientError, ParamValidationError) as ex:
        raise KinesisWebRtcChannelError(
            f"Failed to get signal endpoint {channel_name=} with {ex=}"
        )

    endpoint_list = signaling_channel_endpoint_response.get("ResourceEndpointList", [])

    wss_endpoint = None
    https_endpoint = None
    for endpoint in endpoint_list:
        if endpoint["Protocol"] == "WSS" and endpoint.get("ResourceEndpoint"):
            wss_endpoint = endpoint["ResourceEndpoint"]
        elif endpoint["Protocol"] == "HTTPS" and endpoint.get("ResourceEndpoint"):
            https_endpoint = endpoint["ResourceEndpoint"]

    if not wss_endpoint:
        raise KinesisWebRtcEndpointError(
            f"WSS endpoint does not exist in {endpoint_list=}"
        )

    if not https_endpoint:
        raise KinesisWebRtcEndpointError(
            f"HTTPS endpoint does not exist in {endpoint_list=}"
        )

    return WebRtcChannelInfo(
        channel_arn=channel_arn,
        wss_endpoint=wss_endpoint,
        https_endpoint=https_endpoint,
    )


def get_webrtc_ice_servers(
    boto_session_maker: BotoSessionFn,
    https_endpoint: str,
    channel_arn: str,
    client_id: str,
) -> list[IceServerData]:
    """Get a list of ICE servers for the WebRTC connection from AWS.
    NOTE: we force the use of TURN servers here."""
    try:
        boto_session = boto_session_maker()
        kinesis_signal_client = boto_session.client(
            "kinesis-video-signaling", endpoint_url=https_endpoint
        )
        # Get ICE server configuration
        ice_server_config_response = kinesis_signal_client.get_ice_server_config(
            ChannelARN=channel_arn, ClientId=client_id, Service="TURN"
        )
    except (ClientError, ParamValidationError) as ex:
        raise KinesisWebRtcIceConfigError(
            f"Failed to get ICE server config {ex=}, {channel_arn=}, {client_id=}"
        )
    ice_server_list = ice_server_config_response.get("IceServerList", [])

    ice_servers = []
    for ice_server in ice_server_list:
        if "Uris" not in ice_server:
            continue
        ice_servers.append(
            IceServerData(
                urls=ice_server["Uris"],
                username=ice_server.get("Username", None),
                credential=ice_server.get("Password", None),
            )
        )
    if len(ice_servers) == 0:
        raise KinesisWebRtcNoIceServersError("Empty ICE server list")
    return ice_servers


async def live_kinesis_webrtc_request(
    boto_session_maker: BotoSessionFn, params: KinesisVideoLiveConfig, client_id: str
) -> WebRtcData:
    """Request a live stream with webRTC."""
    channel_info = await run_async(
        lambda: get_webrtc_channel_info(boto_session_maker, params.upload_stream_name)
    )
    ice_servers = await run_async(
        lambda: get_webrtc_ice_servers(
            boto_session_maker,
            channel_info.https_endpoint,
            channel_info.channel_arn,
            client_id,
        )
    )
    return WebRtcData(
        channel_info=channel_info, client_id=client_id, ice_servers=ice_servers
    )
