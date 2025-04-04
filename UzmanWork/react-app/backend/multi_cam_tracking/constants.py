# The maximum number of retries when querying responses from the NVR.
from datetime import timedelta

MAX_RETRIES = 60
# The Key used to store the journey response status in the value store.
JOURNEY_RESPONSE_STATUS_KEY = "{request_id}-{nvr_uuid}"
# Number of top-k results to be sent in the upload request.
JOURNEY_REQUEST_TOP_K = 5
# TODO(@lberg): this should be sent to core (or included in top_k directly)
JOURNEY_REQUEST_TOP_K_MULTIPLE = 20
# Number of top-k results to return to the client for each camera.
JOURNEY_RESPONSE_TOP_K = 5
# Don't show Journey results with a score lower than this.
JOURNEY_SCORE_THRESHOLD = 0.75
# The minimum lifespan of a track. Tracks that are shorter than this will be padded
# by half of this value on each side.
MIN_TRACK_LIFESPAN = timedelta(seconds=10)
