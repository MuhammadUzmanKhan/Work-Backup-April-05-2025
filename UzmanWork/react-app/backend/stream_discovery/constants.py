from datetime import timedelta

# if a camera is not seen in the discovery for this long, it is considered stale
# and removed from cached discoveries
CACHE_CAMERA_STALE_TIME = timedelta(minutes=45)
# cache expiration time for the discovery
CACHE_DISCOVERY_EXPIRATION = timedelta(hours=1)
