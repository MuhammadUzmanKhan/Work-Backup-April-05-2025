import asyncio
import datetime
import logging
import os
import sys
import warnings
from argparse import ArgumentParser

sys.path.append(os.getcwd())
from backend.database import models, orm  # noqa: E402  # noqa: E402
from scripts.database_util import get_database  # noqa: E402

warnings.filterwarnings("ignore", category=DeprecationWarning)


async def main() -> None:
    logging.basicConfig(level=logging.ERROR)
    parser = ArgumentParser()
    parser.add_argument("--camera-mac-address", type=str, required=True)
    parser.add_argument(
        "--detection-object-type",
        type=str,
        action="extend",
        choices=[t.value for t in models.DetectionObjectType],
        nargs="+",
        required=True,
    )
    parser.add_argument("--roi-polygon", type=str, required=False)
    parser.add_argument(
        "--day-of-week",
        type=str,
        action="extend",
        nargs="+",
        choices=[day.value for day in models.DayOfWeek],
        required=False,
    )
    parser.add_argument("--min-active-duration-s", type=int, required=True)
    parser.add_argument("--max-idle-duration-s", type=int, required=True)
    parser.add_argument(
        "--start_time",
        type=lambda x: datetime.datetime.fromisoformat(f"{x}T00:00:00.000"),
        required=False,
    )
    parser.add_argument(
        "--end_time",
        type=lambda x: datetime.datetime.fromisoformat(f"{x}T00:00:00.000"),
        required=False,
    )
    parser.add_argument("--email", type=str, required=False)
    parser.add_argument("--phone", type=str, required=False)
    parser.add_argument("--enabled", action="store_true")
    args = parser.parse_args()

    db = get_database()

    days = (
        set(models.DayOfWeek(day) for day in args.day_of_week)
        if args.day_of_week is not None
        else set()
    )

    top_left = (0, 0)
    bottom_right = (1, 1)
    rect_roi = [top_left, bottom_right]
    object_types = (
        set(models.DetectionObjectType(t) for t in args.detection_object_type)
        if args.detection_object_type is not None
        else set()
    )

    alert_metadata = models.UserAlertSettingCreate(
        camera_mac_address=args.camera_mac_address,
        detection_object_types=object_types,
        # TODO(nedyalko): Add polygon parsing.
        roi_polygon=rect_roi,
        days_of_week=days,
        start_time=args.start_time,
        end_time=args.end_time,
        min_active_duration_s=args.min_active_duration_s,
        max_idle_duration_s=args.max_idle_duration_s,
        email=args.email,
        phone=args.phone,
        enabled=args.enabled,
    )

    async with db.tenant_session(tenant="unassigned") as session:
        alert = await orm.UserAlertSetting.new_alert_setting(session, alert_metadata)
        print(alert)


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
