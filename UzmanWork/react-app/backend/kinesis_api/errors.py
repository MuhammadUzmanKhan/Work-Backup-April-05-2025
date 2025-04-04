class KinesisError(Exception):
    """"""


class KinesisEndpointError(KinesisError):
    """"""


class KinesisHlsUrlError(KinesisError):
    """"""


class KinesisFragmentsError(KinesisError):
    """"""


class KinesisClipRetentionUpdateError(KinesisError):
    """"""


class KinesisLiveRetentionUpdateError(KinesisError):
    """"""


class KinesisRetentionRequestError(KinesisError):
    """"""


class KinesisPlayListUrlError(KinesisError):
    """"""


class KinesisStreamNameError(KinesisError):
    """"""


class KinesisWebRtcError(KinesisError):
    """"""


class KinesisWebRtcChannelError(KinesisWebRtcError):
    """"""


class KinesisWebRtcEndpointError(KinesisWebRtcError):
    """"""


class KinesisWebRtcIceConfigError(KinesisWebRtcError):
    """"""


class KinesisWebRtcNoIceServersError(KinesisWebRtcError):
    """"""
