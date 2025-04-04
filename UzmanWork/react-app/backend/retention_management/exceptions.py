class RetentionTaskError(Exception):
    """Base class for exceptions in this module."""


class RetentionTaskResourceError(Exception):
    """Base class for resource exceptions in this module."""


class PerceptionRetentionUpdateError(RetentionTaskResourceError):
    """Exception raised for errors in the perception retention update."""


class ResourceDeleteError(RetentionTaskResourceError):
    """Error raised when a resource fails to delete."""


class ResourceS3DeleteError(ResourceDeleteError):
    """Error raised when a thumbnail fails to delete from s3."""


class ResourceCopyError(RetentionTaskResourceError):
    """Error raised when a resource fails to be copied."""
