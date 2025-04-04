import enum

import pydantic

from backend.database.models import FeatureFlags

# This enum represents flags that can be set for an organization from the
# frontend.
# Note that the enum values here are a subset of FeatureFlags. This is
# important, so we can use the `in` operator with an enum from ExposedOrgFlags and
# check if it is set in FeatureFlags.
# Details about how we created the ExposureOrgFlags enum can be found here:
# https://stackoverflow.com/questions/54221444/how-can-i-extract-a-python-enum-subset-without-redefining-it
# Because mypy can't handle dynamically generated enum below, we need to ignore
# it. See https://github.com/python/mypy/issues/5317.
ExposedOrgFlags = enum.Enum(  # type: ignore
    "ExposedOrgFlags",
    # mypy not happy here cause non-literal dict as the second arg of Enum not supported
    {
        e.name: e.value
        for e in FeatureFlags
        if e
        in [
            FeatureFlags.INACTIVITY_LOGOUT_ENABLED,
            FeatureFlags.FACE_ENABLED,
            FeatureFlags.LICENSE_PLATE_RECOGNITION_ENABLED,
            FeatureFlags.SUPPORT_TEAM_DISABLED,
        ]
    },
)


class UpdateOrgFlagRequest(pydantic.BaseModel):
    flag_enum: ExposedOrgFlags
    flag_value: bool
