import urllib.parse
from datetime import timedelta
from unittest.mock import MagicMock

import boto3
import pytest
from botocore.exceptions import ClientError
from pydantic import ValidationError
from starlette.datastructures import URL

from backend.constants import DEFAULT_LIVE_STREAM_RETENTION_DUR
from backend.escapi.protocol_models import VideoResRequestType
from backend.kinesis_api.constants import (
    HLS_ENDLIST_TAG,
    HLS_INIT_FRAGMENT_ROUTE,
    HLS_MASTER_PLAYLIST_ROUTE,
    HLS_MEDIA_FRAGMENT_ROUTE,
    HLS_MEDIA_PLAYLIST_ROUTE,
    HLS_PLAYLIST_TYPE_TAG,
)
from backend.kinesis_api.errors import KinesisEndpointError, KinesisHlsUrlError
from backend.kinesis_api.hls_utils import (
    _gen_master_playlist_backend_url,
    _perform_master_playlist_url_surgery,
    adapt_playlist_for_live_replay,
    gen_on_demand_media_playlist_kinesis_url,
    replace_fragments_urls_in_media_playlist,
    replace_url_in_master_playlist,
)
from backend.kinesis_api.models import (
    KinesisVideoClipConfig,
    KinesisVideoClipRequest,
    KinesisVideoLiveConfig,
    StaticResolutionConfig,
)
from backend.kinesis_api.utils import _clip_kinesis_request, _live_kinesis_hls_request
from backend.utils import AwareDatetime


def test_invalid_kinesis_video_clip_request() -> None:
    with pytest.raises(ValidationError):
        KinesisVideoClipRequest(
            mac_address="MAC_ADDRESS",
            start_time=AwareDatetime.utcnow(),
            end_time=AwareDatetime.utcnow() - timedelta(minutes=5),
            resolution_config=StaticResolutionConfig(
                static_resolution=VideoResRequestType.High
            ),
        )


async def test_live_kinesis_hls_request_endpoint_error() -> None:
    params = KinesisVideoLiveConfig(
        stream_hash="LIVE_STREAM",
        resolution_config=StaticResolutionConfig(
            static_resolution=VideoResRequestType.High
        ),
        use_webrtc=False,
        retention_period=DEFAULT_LIVE_STREAM_RETENTION_DUR,
    )
    boto_session = MagicMock(spec=boto3.Session)
    video_client = MagicMock()
    video_client.get_data_endpoint.side_effect = ClientError({}, "")
    boto_session.client.return_value = video_client
    with pytest.raises(KinesisEndpointError):
        await _live_kinesis_hls_request(lambda: boto_session, params)
        video_client.get_data_endpoint.assert_called_once()


async def test_retrieve_kinesis_url_hls_error() -> None:
    params = KinesisVideoClipConfig(
        stream_hash="CLIP_STREAM",
        start_time=AwareDatetime.utcnow(),
        end_time=AwareDatetime.utcnow() + timedelta(minutes=5),
        clip_stream_unique_id="abcd",
        resolution_config=StaticResolutionConfig(
            static_resolution=VideoResRequestType.High
        ),
    )
    boto_session = MagicMock(spec=boto3.Session)
    video_client = MagicMock()
    hls_client = MagicMock()
    hls_client.get_hls_streaming_session_url.side_effect = ClientError({}, "")
    boto_session.client.side_effect = [video_client, hls_client]
    with pytest.raises(KinesisHlsUrlError):
        await _clip_kinesis_request(lambda: boto_session, params)
        video_client.get_data_endpoint.assert_called_once()
        hls_client.get_hls_streaming_session_url.assert_called_once()


def test_gen_master_playlist_backend_url() -> None:
    base_url_str = "https://kinesis.us-west-2.aws.com/hls/v1"
    kinesis_master_playlist_url = URL(
        f"{base_url_str}/{HLS_MASTER_PLAYLIST_ROUTE}?SessionToken=CiC7uozggtR0"
    )
    backend_master_playlist_url = URL(
        f"https://backend/API/v1/{HLS_MASTER_PLAYLIST_ROUTE}"
    )
    upload_stream_name = "stream_name"
    start_time = AwareDatetime.utcnow()
    end_time = AwareDatetime.utcnow() + timedelta(minutes=5)

    url = _gen_master_playlist_backend_url(
        kinesis_master_playlist_url,
        backend_master_playlist_url,
        upload_stream_name,
        start_time,
        end_time,
    )
    assert str(backend_master_playlist_url) in str(url)
    assert f"OriginalUrl={urllib.parse.quote_plus(base_url_str)}" in str(url)
    assert f"StreamName={urllib.parse.quote_plus(upload_stream_name)}" in str(url)
    assert f"StartTime={urllib.parse.quote_plus(start_time.isoformat())}" in str(url)
    assert f"EndTime={urllib.parse.quote_plus(end_time.isoformat())}" in str(url)


def test_perform_master_playlist_url_surgery() -> None:
    orig_master_playlist_url = (
        "getHLSMediaPlaylist.m3u8?SessionToken=CiC7uozgpDA~&TrackNumber=1"
    )
    backend_media_playlist_url = URL("http://backend.com:5173/api/v1/media.m3u8")
    upload_stream_name = "stream_name"
    start_time = AwareDatetime.utcnow()
    end_time = AwareDatetime.utcnow() + timedelta(minutes=5)

    url = _perform_master_playlist_url_surgery(
        orig_master_playlist_url,
        backend_media_playlist_url,
        upload_stream_name,
        start_time,
        end_time,
    )
    assert str(backend_media_playlist_url) in str(url)
    assert f"StreamName={urllib.parse.quote_plus(upload_stream_name)}" in str(url)
    assert "SessionToken=" in str(url)
    assert f"StartTime={urllib.parse.quote_plus(start_time.isoformat())}" in str(url)
    assert f"EndTime={urllib.parse.quote_plus(end_time.isoformat())}" in str(url)
    # we should have kept the track number
    assert "TrackNumber=1" in str(url)


def test_replace_url_in_master_playlist() -> None:
    master_playlist_content = """
#EXTM3U
#EXT-X-VERSION:1
#EXT-X-STREAM-INF:CODECS="avc1.4d4032",RESOLUTION=2592x1944,FRAME-RATE=15.02,BANDWIDTH=329640
getHLSMediaPlaylist.m3u8?SessionToken=CiC7uozgpDA~&TrackNumber=1
    """
    backend_media_playlist_url = URL("http://backend.com:5173/api/v1/media.m3u8")
    upload_stream_name = "stream_name"
    start_time = AwareDatetime.utcnow()
    end_time = AwareDatetime.utcnow() + timedelta(minutes=5)

    new_master_playlist = replace_url_in_master_playlist(
        master_playlist_content,
        backend_media_playlist_url,
        upload_stream_name,
        start_time,
        end_time,
    )
    assert str(backend_media_playlist_url) in str(new_master_playlist)
    assert f"StreamName={urllib.parse.quote_plus(upload_stream_name)}" in str(
        new_master_playlist
    )
    assert "SessionToken=" in str(new_master_playlist)
    assert f"StartTime={urllib.parse.quote_plus(start_time.isoformat())}" in str(
        new_master_playlist
    )
    assert f"EndTime={urllib.parse.quote_plus(end_time.isoformat())}" in str(
        new_master_playlist
    )
    # we should have kept the track number
    assert "TrackNumber=1" in str(new_master_playlist)


def test_replace_url_in_master_playlist_with_audio_track() -> None:
    master_playlist_content = """
#EXTM3U
#EXT-X-VERSION:1
#EXT-X-MEDIA:AUTOSELECT=YES,FORCED=NO,TYPE=AUDIO,URI="getHLSMediaPlaylist.m3u8?SessionToken=CiA2CyLfyZrA9f8CARoUTPrVsh_6WFAMQDZCZDoQqGgXvxIQDCr2zZRaXtnwjMjd-XeuxhoZfvvrR5JLSNUDwQvHeQPGmtFJVmJme4LfHyIgwEmE0fqxWhM_IXOBhHY58kMBeBprYEfbulDZKlF9YcI~&TrackNumber=2",GROUP-ID="audio",DEFAULT=NO,NAME="audio"
#EXT-X-STREAM-INF:CODECS="avc1.42c032,mp4a.40.2",RESOLUTION=2592x1944,FRAME-RATE=15.01,BANDWIDTH=2583047,AUDIO="audio"
getHLSMediaPlaylist.m3u8?SessionToken=CiA2CyLfyZrA9f8CARoUTPrVsh_6WFAMQDZCZDoQqGgXvxIQDCr2zZRaXtnwjMjd-XeuxhoZfvvrR5JLSNUDwQvHeQPGmtFJVmJme4LfHyIgwEmE0fqxWhM_IXOBhHY58kMBeBprYEfbulDZKlF9YcI~&TrackNumber=1
    """
    backend_media_playlist_url = URL("http://backend.com:5173/api/v1/media.m3u8")
    upload_stream_name = "stream_name"
    start_time = AwareDatetime.fromisoformat("2021-05-17T13:48:35.994+00:00")
    end_time = AwareDatetime.fromisoformat("2021-05-17T13:48:38.656+00:00")

    expected_new_master_playlist_content = """
#EXTM3U
#EXT-X-VERSION:1
#EXT-X-MEDIA:AUTOSELECT=YES,FORCED=NO,TYPE=AUDIO,URI="http://backend.com:5173/api/v1/media.m3u8?SessionToken=CiA2CyLfyZrA9f8CARoUTPrVsh_6WFAMQDZCZDoQqGgXvxIQDCr2zZRaXtnwjMjd-XeuxhoZfvvrR5JLSNUDwQvHeQPGmtFJVmJme4LfHyIgwEmE0fqxWhM_IXOBhHY58kMBeBprYEfbulDZKlF9YcI~&TrackNumber=2&StreamName=stream_name&StartTime=2021-05-17T13%3A48%3A35.994000%2B00%3A00&EndTime=2021-05-17T13%3A48%3A38.656000%2B00%3A00",GROUP-ID="audio",DEFAULT=NO,NAME="audio"
#EXT-X-STREAM-INF:CODECS="avc1.42c032,mp4a.40.2",RESOLUTION=2592x1944,FRAME-RATE=15.01,BANDWIDTH=2583047,AUDIO="audio"
http://backend.com:5173/api/v1/media.m3u8?SessionToken=CiA2CyLfyZrA9f8CARoUTPrVsh_6WFAMQDZCZDoQqGgXvxIQDCr2zZRaXtnwjMjd-XeuxhoZfvvrR5JLSNUDwQvHeQPGmtFJVmJme4LfHyIgwEmE0fqxWhM_IXOBhHY58kMBeBprYEfbulDZKlF9YcI~&TrackNumber=1&StreamName=stream_name&StartTime=2021-05-17T13%3A48%3A35.994000%2B00%3A00&EndTime=2021-05-17T13%3A48%3A38.656000%2B00%3A00
    """

    new_master_playlist = replace_url_in_master_playlist(
        master_playlist_content,
        backend_media_playlist_url,
        upload_stream_name,
        start_time,
        end_time,
    )

    # Check that line by line the new playlist is the same as the expected one
    new_master_playlist_lines = new_master_playlist.splitlines()
    expected_new_master_playlist_lines = (
        expected_new_master_playlist_content.splitlines()
    )
    assert len(new_master_playlist_lines) == len(expected_new_master_playlist_lines)
    for i in range(len(new_master_playlist_lines)):
        assert new_master_playlist_lines[i] == expected_new_master_playlist_lines[i]


def test_gen_on_demand_media_playlist_kinesis_url() -> None:
    base_url_str = "https://kinesis.us-west-2.aws.com/hls/v1"
    kinesis_media_playlist_url = URL(
        f"{base_url_str}/{HLS_MASTER_PLAYLIST_ROUTE}?SessionToken=CiC7uozggtR0"
    )
    track_number = "2"
    url = gen_on_demand_media_playlist_kinesis_url(
        kinesis_media_playlist_url, track_number
    )
    assert HLS_MASTER_PLAYLIST_ROUTE not in str(url)
    assert HLS_MEDIA_PLAYLIST_ROUTE in str(url)
    assert f"TrackNumber={track_number}" in str(url)


def test_replace_fragments_urls_in_media_playlist() -> None:
    media_playlist_content = """
#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-DISCONTINUITY
#EXT-X-MAP:URI="getMP4InitFragment.mp4?SessionToken=CiC~&TrackNumber=1&SequenceNumber=0"
#EXT-X-PROGRAM-DATE-TIME:2023-05-17T13:48:35.994Z
#EXTINF:2.663,
getMP4MediaFragment.mp4?FragmentNumber=9134385&SessionToken=CiC7~&TrackNumber=1
#EXT-X-DISCONTINUITY
#EXT-X-PROGRAM-DATE-TIME:2023-05-17T13:48:38.656Z
#EXTINF:2.68,
getMP4MediaFragment.mp4?FragmentNumber=913438518&SessionToken=CiC7~&TrackNumber=1
#EXT-X-DISCONTINUITY
"""
    base_url_str = "http://NEW_URL"
    media_playlist_url = URL(f"{base_url_str}/{HLS_MEDIA_PLAYLIST_ROUTE}?TrackNumber=1")
    content = replace_fragments_urls_in_media_playlist(
        media_playlist_content, media_playlist_url
    )
    assert f"{base_url_str}/{HLS_INIT_FRAGMENT_ROUTE}" in str(content)
    assert f"{base_url_str}/{HLS_MEDIA_FRAGMENT_ROUTE}" in str(content)


def test_adapt_endlist() -> None:
    media_playlist_content = """
#EXTM3U
#EXT-X-VERSION:7
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-DISCONTINUITY
#EXT-X-MAP:URI="getMP4InitFragment.mp4?SessionToken=CiC~&TrackNumber=1&SequenceNumber=0"
#EXT-X-PROGRAM-DATE-TIME:2023-05-17T13:48:35.994Z
#EXTINF:2.663,
getMP4MediaFragment.mp4?FragmentNumber=9134385&SessionToken=CiC7~&TrackNumber=1
#EXT-X-DISCONTINUITY
#EXT-X-PROGRAM-DATE-TIME:2023-05-17T13:48:38.656Z
#EXTINF:2.68,
getMP4MediaFragment.mp4?FragmentNumber=913438518&SessionToken=CiC7~&TrackNumber=1
#EXT-X-DISCONTINUITY
#EXT-X-ENDLIST

"""
    # end in the future
    new_playlist = adapt_playlist_for_live_replay(
        media_playlist_content,
        AwareDatetime.fromisoformat("2023-05-17T13:50:38.656+00:00"),
    )
    assert HLS_PLAYLIST_TYPE_TAG not in new_playlist
    assert HLS_ENDLIST_TAG not in new_playlist
    # end same time as last fragment
    new_playlist = adapt_playlist_for_live_replay(
        media_playlist_content,
        AwareDatetime.fromisoformat("2023-05-17T13:48:38.656+00:00"),
    )
    assert HLS_PLAYLIST_TYPE_TAG in new_playlist
    assert HLS_ENDLIST_TAG in new_playlist

    # end in the past
    new_playlist = adapt_playlist_for_live_replay(
        media_playlist_content,
        AwareDatetime.fromisoformat("2023-05-17T13:48:30.656+00:00"),
    )
    assert HLS_PLAYLIST_TYPE_TAG in new_playlist
    assert HLS_ENDLIST_TAG in new_playlist
