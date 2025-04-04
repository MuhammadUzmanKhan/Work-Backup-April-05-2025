import logging
import re
from datetime import timedelta

from fastapi.datastructures import QueryParams
from pydantic import AnyHttpUrl, parse_obj_as
from starlette.datastructures import URL

from backend import logging_config, utils
from backend.database.models import HlsSessionInfo
from backend.kinesis_api.constants import (
    HLS_ENDLIST_TAG,
    HLS_EXT_DATE_TIME,
    HLS_EXT_INF,
    HLS_INIT_FRAGMENT_ROUTE,
    HLS_MASTER_PLAYLIST_ROUTE,
    HLS_MEDIA_FRAGMENT_ROUTE,
    HLS_MEDIA_PLAYLIST_ROUTE,
    HLS_MEDIA_TAG,
    HLS_PLAYLIST_TYPE_TAG,
)
from backend.kinesis_api.errors import KinesisPlayListUrlError
from backend.kinesis_api.models import KinesisClipParams
from backend.value_store.value_store import ValueStore

logger = logging.getLogger(logging_config.LOGGER_NAME)


def _gen_master_playlist_backend_url(
    kinesis_master_playlist_url: URL,
    backend_master_playlist_url: URL,
    upload_stream_name: str,
    start_time: utils.AwareDatetime,
    end_time: utils.AwareDatetime,
) -> URL:
    """Generate a url for a master playlist pointing to our backend."""
    original_url = str(kinesis_master_playlist_url.replace_query_params())
    # replace path with our backend, add query params
    master_playlist_url = kinesis_master_playlist_url.replace(
        scheme=backend_master_playlist_url.scheme,
        netloc=backend_master_playlist_url.netloc,
        path=backend_master_playlist_url.path,
    )
    master_playlist_url = master_playlist_url.include_query_params(
        OriginalUrl=original_url,
        StreamName=upload_stream_name,
        StartTime=start_time.isoformat(),
        EndTime=end_time.isoformat(),
    )
    return master_playlist_url


def _perform_master_playlist_url_surgery(
    orig_master_playlist_url: str,
    media_playlist_replace_url: URL,
    stream_name: str,
    start_time: utils.AwareDatetime,
    end_time: utils.AwareDatetime,
) -> str:
    url = URL(orig_master_playlist_url)
    url = url.replace(
        scheme=media_playlist_replace_url.scheme,
        netloc=media_playlist_replace_url.netloc,
        path=media_playlist_replace_url.path,
    )
    # add additional query params
    url = url.include_query_params(
        StreamName=stream_name,
        StartTime=start_time.isoformat(),
        EndTime=end_time.isoformat(),
    )
    return str(url)


def _is_playlist_last_fragment_before(
    kinesis_media_playlist_content: str, time: utils.AwareDatetime
) -> bool:
    # start from the end of the file and get the last program time and duration
    last_program_time = None
    last_duration = None
    for line in reversed(kinesis_media_playlist_content.splitlines()):
        if line.startswith(HLS_EXT_DATE_TIME) and not last_program_time:
            line_iso = line.split(f"{HLS_EXT_DATE_TIME}:")[1].replace("Z", "+00:00")
            last_program_time = utils.AwareDatetime.fromisoformat(line_iso)
        if line.startswith(HLS_EXT_INF) and not last_duration:
            duration_ms = float(line.split(f"{HLS_EXT_INF}:")[1].strip(",")) * 1000
            last_duration = timedelta(milliseconds=duration_ms)

        if last_program_time and last_duration:
            break

    if not last_program_time or not last_duration:
        return False
    return last_program_time + last_duration < time


def replace_url_in_master_playlist(
    kinesis_master_playlist_content: str,
    media_playlist_replace_url: URL,
    stream_name: str,
    start_time: utils.AwareDatetime,
    end_time: utils.AwareDatetime,
) -> str:
    """Replace the url of the media playlist in the master content
    with our backend url. Also add additional query params."""
    backend_master_playlist_content = ""
    for line in kinesis_master_playlist_content.splitlines():
        # Either the line starts with the playlist route or
        # it is a #EXT-X-MEDIA tag and its URI starts with the playlist route
        if line.startswith(HLS_MEDIA_PLAYLIST_ROUTE):
            line = _perform_master_playlist_url_surgery(
                orig_master_playlist_url=line,
                media_playlist_replace_url=media_playlist_replace_url,
                stream_name=stream_name,
                start_time=start_time,
                end_time=end_time,
            )
        elif line.startswith(HLS_MEDIA_TAG):
            # Extract the URL from the line using regex. It is between the quotes:
            # URI="url"
            # Note that python internally caches the compiled regexes, so we
            # don't need to explicitly compile it
            regex = r'URI="(' + HLS_MEDIA_PLAYLIST_ROUTE + r'[^"]*)"'
            matches = re.search(regex, line)
            if matches:
                orig_url = matches.group(1)
                line = line.replace(
                    orig_url,
                    _perform_master_playlist_url_surgery(
                        orig_master_playlist_url=orig_url,
                        media_playlist_replace_url=media_playlist_replace_url,
                        stream_name=stream_name,
                        start_time=start_time,
                        end_time=end_time,
                    ),
                )

        backend_master_playlist_content += f"{line}\n"
    return backend_master_playlist_content


def gen_on_demand_media_playlist_kinesis_url(
    on_demand_master_playlist_url: URL, track_number: str
) -> URL:
    """Generate a url for a media playlist pointing to kinesis
    starting from a master url."""
    return URL(
        str(on_demand_master_playlist_url).replace(
            HLS_MASTER_PLAYLIST_ROUTE, HLS_MEDIA_PLAYLIST_ROUTE
        )
    ).include_query_params(TrackNumber=track_number)


def replace_fragments_urls_in_media_playlist(
    kinesis_media_playlist_content: str, media_playlist_url: URL
) -> str:
    """Replace fragment urls in a media playlist with such that
    they are absolute paths and not relative to the playlist."""
    new_base_url = URL(
        str(media_playlist_url)
        .split(HLS_MEDIA_PLAYLIST_ROUTE)[0]
        .replace(HLS_MEDIA_PLAYLIST_ROUTE, "")
    )
    kinesis_media_playlist_content = kinesis_media_playlist_content.replace(
        HLS_INIT_FRAGMENT_ROUTE,
        f"{str(new_base_url).strip('/')}/{HLS_INIT_FRAGMENT_ROUTE}",
    )
    kinesis_media_playlist_content = kinesis_media_playlist_content.replace(
        HLS_MEDIA_FRAGMENT_ROUTE,
        f"{str(new_base_url).strip('/')}/{HLS_MEDIA_FRAGMENT_ROUTE}",
    )
    return kinesis_media_playlist_content


def adapt_playlist_for_live_replay(
    kinesis_media_playlist_content: str, end_time: utils.AwareDatetime
) -> str:
    # optionally remove the endlist tag and
    # video-on-demand tag if the playlist is not finished
    if _is_playlist_last_fragment_before(kinesis_media_playlist_content, end_time):
        content_text = kinesis_media_playlist_content.replace(HLS_ENDLIST_TAG, "")
        content_text = content_text.replace(f"{HLS_PLAYLIST_TYPE_TAG}:VOD", "")
        return content_text
    return kinesis_media_playlist_content


async def redirect_master_playlist_to_backend(
    kinesis_master_playlist_url: str,
    redirect_url: URL,
    clip_params: KinesisClipParams,
    value_store: ValueStore,
) -> AnyHttpUrl:
    backend_master_playlist_url = _gen_master_playlist_backend_url(
        URL(kinesis_master_playlist_url),
        redirect_url,
        clip_params.upload_stream_name,
        clip_params.start_time,
        clip_params.end_time,
    )
    if (
        session_token := QueryParams(backend_master_playlist_url.query).get(
            "SessionToken"
        )
    ) is None:
        raise KinesisPlayListUrlError("Could not get session token from Kinesis")
    await value_store.set_model(
        key=f"{session_token}-{clip_params.upload_stream_name}",
        model=HlsSessionInfo(
            token=session_token,
            stream_name=clip_params.upload_stream_name,
            start_time=clip_params.start_time,
            end_time=clip_params.end_time,
        ),
        expiration=timedelta(hours=24),
    )
    # Return a pydantic object we can serialize
    http_url: AnyHttpUrl = parse_obj_as(AnyHttpUrl, str(backend_master_playlist_url))
    return http_url
