class AlertNotificationError(Exception):
    pass


class MemberNotifyError(AlertNotificationError):
    pass


class TooManyTriesException(BaseException):
    pass


class AlertVideoClipRequestError(Exception):
    pass


class TooSoonError(Exception):
    pass
