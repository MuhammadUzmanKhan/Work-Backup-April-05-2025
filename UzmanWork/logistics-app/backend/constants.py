from datetime import timedelta
from pathlib import Path

from pydantic import EmailStr

# Parameters for aggregating detection events.
# If two detections are separated by less than this value, they will be aggregated.
MAX_AGGREGATION_TIME_GAP_S = 5
# Minimum duration of an aggregated event to consider it as valid, if it has duration
# less than this value, it will be discarded.
MIN_AGGREGATED_EVENT_LENGTH = timedelta(seconds=0.0)
# Path were we store static videos
STATIC_CLIPS_PATH = Path("backend/static/clips")
# Threshold for removing old stored clips
STORED_CLIPS_REMOVAL_DELTA = timedelta(hours=1)
# MIN intersection ratio to consider a detection as valid for
# PCP driven alert detection
MIN_ROI_INTERSECTION_RATIO = 0.1
# Minimum confidence score to consider a detection as valid
MIN_CONFIDENCE_THRESHOLD = 0.5
# Short events with track duration less than this value will be treated using custom
# confidence score.
SHORT_EVENT_LENGTH = timedelta(seconds=0.5)
# Minimum confidence score to consider a detection as valid for short events
MIN_SHORT_EVENT_CONFIDENCE_THRESHOLD = 0.7

# Parameters for aggregating motion detection events.
# If two motion detections are separated by less than this value, they will be
# aggregated.
MAX_MOTION_AGGREGATION_TIME_GAP = timedelta(seconds=5)
# Time interval to aggregate motion detections for motion detection analytics
DASHBOARD_EVENT_COUNTING_TIME_INTERVAL = timedelta(hours=1)

# Parameters for detection analytics
# Time interval to truncate detections for detection analytics, here we truncate
# timestamp of detections to the nearest time of each time interval.
ANALYTICS_TIME_INTERVAL = timedelta(hours=1)
# Minimum confidence score to consider a detection as valid
ANALYTICS_MIN_CONFIDENCE_THRESHOLD = 0.7
# Track IDs to be excluded from analytics, e.g. Motion & Fake Objects have track ID of
# zero and they are excluded from analytics.
ANALYTICS_EXCLUDED_TRACK_IDS = [0]

# Every ALERT_CHECK_INTERVAL_SECONDS, check alerts
ALERT_CHECK_INTERVAL_SECONDS = 10
# Every IDLE_ALERT_CHECK_INTERVAL_SECONDS, check alerts
IDLE_ALERT_CHECK_INTERVAL_SECONDS = 10
ALERT_CHECK_MIN_INTERVAL_SECONDS = 8
# The maximum interval between two checks
ALERT_CHECK_MAX_INTERVAL_SECONDS = 60

# If the process time exceed this many seconds, we should log it as a warning.
MIN_PROCESS_SECONDS_TO_ALERT = 5

# Number of seconds deplay to trigger alert query to handle PCP ingestion delay.
ALERT_CHECK_DELAY_TO_WAIT_FOR_PCP = 5
# Shared videos for alerts expire after this duration from the start time of the
# alert
ALERT_VIDEO_EXPIRATION_DURATION: timedelta = timedelta(days=1)
# The time offset to start alert video before the occurrence time of the alert
ALERT_VIDEO_START_TIME_OFFSET: timedelta = timedelta(seconds=5)
# The time offset to end alert video after the occurrence time of the alert
ALERT_VIDEO_END_TIME_OFFSET: timedelta = timedelta(minutes=5)
# After alert is triggered, within this duration, no new alert will be triggered.
# After this duration, new alert will be triggered if there's new detection and
# existing active alert will be closed if no new detection.
# Note this duration is w.r.t alert start time.
DO_NOT_ENTER_ALERT_MAX_DURATION = timedelta(minutes=5)
# Same as DO_NOT_ENTER_ALERT_MAX_DURATION, but for idling alert and the IDLING
# duration should be taken into account. For example, if the idling duration is
# N minutes, then the max duration for idling alert is
# N + IDLE_ALERT_MAX_DURATION minutes.
IDLE_ALERT_MAX_DURATION = timedelta(minutes=5)

# Minimum number of detections in the passed time interval to be considered as
# valid for DO_NOT_ENTER alert triggering.
DO_NOT_ENTER_ALERT_MIN_NUM_DETECTIONS = 10
# Minimum number of moving detections in the passed time interval to be considered as
# valid for DO_NOT_ENTER alert triggering.
DO_NOT_ENTER_ALERT_MIN_NUM_MOVING_DETECTIONS = 5

# IF the alert duration spans not more than MIN_ACTIVE_DURATION, do not consider
# it as a valid alert.
MIN_ACTIVE_DURATION = timedelta(seconds=2)

# Regex for validating mac addresses
REGEX_MAC_ADDRESS = r"([0-9A-F]{2}[:-]){5}([0-9A-F]{2})(-[1-9][0-9]*)?"
REGEX_MAC_ADDRESS_SECONDARY_HEAD = r"([0-9A-F]{2}[:-]){5}([0-9A-F]{2})(-[1-9][0-9]*)"

# Maximum number of retries to get a text search result
MAX_TEXT_SEARCH_RETRIES = 15
# Time to wait between retries
TEXT_SEARCH_RETRY_INTERVAL_S = 1
# For ROI constrained NLP search, we send ROI_NLP_SEARCH_TOP_K_RATIO times more
# request than the raw top_k value for a reasonable recall after ROI filtering.
ROI_NLP_SEARCH_TOP_K_RATIO = 100

# Minimum interval of detections in the passed time interval to be considered as
# valid for alert triggering or extension.
MIN_HIT_DETECTIONS_INTERVAL = timedelta(seconds=2)

# Default value for the unknown perception stack start ID
UNKNOWN_PERCEPTION_STACK_START_ID = "unknown"

# Wait time interval between retries for Clip Upload response
CLIP_S3_UPLOAD_RETRY_WAIT_INTERVAL_S = 5

# For archive video, the retention period is ~10 year
ARCHIVE_VIDEO_STREAM_DATA_RETENTION = timedelta(hours=87576)

MIGRATION_WAIT_TIME_S = 60

# For how long to block sending system health alert messages after an
# alert has been sent
DOWN_ALERT_BACKOFF = timedelta(hours=24)
# Minimum ratio of offline enabled cameras to total enabled cameras to send a
# system health alert
MIN_ENABLED_CAMERAS_DOWN_RATIO_TO_ALERT = 0.5
# How long to wait for an update from the NVR before considering it offline
NVR_ONLINE_TIMEOUT = timedelta(minutes=3)
# How long to wait for an update before considering the camera offline
CAMERA_ONLINE_TIMEOUT = timedelta(seconds=30)
# Increased offline timeout for sending alerts
CAMERA_ONLINE_TIMEOUT_FOR_ALERTS = timedelta(minutes=3)
# How long to wait for an update before considering the backend offline
BACKEND_ONLINE_TIMEOUT = timedelta(minutes=1)
# Support team member emails
SUPPORT_TEAM_EMAILS = [
    EmailStr("ashesh@coram.ai"),
    EmailStr("luca@coram.ai"),
    EmailStr("balazs@coram.ai"),
]
# How long to wait for an alert update before considering the camera pipeline alert to
# be expired after receiving heartbeat from the camera.
# Certain camera pipeline alerts are published every 15 seconds on the edge, so
# we wait for 16 seconds before considering the alert to be expired.
CAMERA_PIPELINE_ALERT_VALIDATION_TIMEOUT = timedelta(seconds=16)

# default live stream (not always-on) retention duration
DEFAULT_LIVE_STREAM_RETENTION_DUR = timedelta(hours=1)

# retention duration for anonymous clips (clips which are not persisted in the DB)
ANONYMOUS_CLIP_RETENTION_DUR = timedelta(hours=1)

# Default for the max number of camera slots an NVR can have
DEFAULT_MAX_NUM_CAMERA_SLOTS_NVR = 16

# For how long to block sending face alert messages after an alert has been sent for the
# same face
FACE_ALERT_COOLDOWN_DURATION = timedelta(minutes=5)
LICENSE_PLATE_ALERT_COOLDOWN_DURATION = timedelta(minutes=5)
# Header for aws cognito auth. If the header is present, we will use cognito for auth
AWS_COGNITO_AUTH_HEADER = "x-Coram-Auth-Cognito"

# Tenant for resources that are not assigned to any tenant
# NOTE(@lberg): do not change this value, as it won't be reflected in the DB
UNASSIGNED_TENANT = "unassigned"

# Default value that we'll try to force the video config FPS if forcing FPS is
# enabled
DEFAULT_FORCE_VIDEO_CONFIG_FPS = 15

# Full rectangle ROI
FULL_TOP_LEFT = [0.0, 0.0]
FULL_BOTTOM_RIGHT = [1.0, 1.0]
FULL_RECT_ROI = [FULL_TOP_LEFT, FULL_BOTTOM_RIGHT]

# This is the name of the endpoint
# that is used to retrieve the HLS master playlist
# when we relay from KVS to the backend
REPLACE_MASTER_PLAYLIST_ENDPOINT_NAME = "retrieve_master_playlist"
REPLACE_MEDIA_PLAYLIST_ENDPOINT_NAME = "retrieve_media_playlist"
