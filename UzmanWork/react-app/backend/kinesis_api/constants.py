# How much time difference we allow around request edges
from datetime import timedelta

# How much time we allow between consecutive fragments to detect gaps
MAX_FRAGMENTS_GAP_S = 5


HLS_MASTER_PLAYLIST_ROUTE = "getHLSMasterPlaylist.m3u8"
HLS_MEDIA_PLAYLIST_ROUTE = "getHLSMediaPlaylist.m3u8"
HLS_INIT_FRAGMENT_ROUTE = "getMP4InitFragment.mp4"
HLS_MEDIA_FRAGMENT_ROUTE = "getMP4MediaFragment.mp4"


HLS_EXT_DATE_TIME = "#EXT-X-PROGRAM-DATE-TIME"
HLS_EXT_INF = "#EXTINF"
HLS_ENDLIST_TAG = "#EXT-X-ENDLIST"
HLS_PLAYLIST_TYPE_TAG = "#EXT-X-PLAYLIST-TYPE"
HLS_MEDIA_TAG = "#EXT-X-MEDIA"


KINESIS_MAX_EXPIRE_TIME = timedelta(hours=12)

# TODO(@lberg): use enum
ON_DEMAND_MODE = "ON_DEMAND"
LIVE_REPLAY_MODE = "LIVE_REPLAY"


KINESIS_MAX_RETRIES = 15
