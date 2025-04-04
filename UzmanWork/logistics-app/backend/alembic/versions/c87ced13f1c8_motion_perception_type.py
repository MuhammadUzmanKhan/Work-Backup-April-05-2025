"""motion perception type

Revision ID: c87ced13f1c8
Revises: 813f682f8806
Create Date: 2023-06-13 08:53:22.583529

"""

from backend.database.migration_utils import TableColumnPair, change_enum_values

# revision identifiers, used by Alembic.
revision = "c87ced13f1c8"
down_revision = "813f682f8806"
branch_labels = None
depends_on = None

DETECTION_OBJECT_TYPE_VALUES = {
    "INVALID",
    "PERSON",
    "BICYCLE",
    "CAR",
    "MOTORCYCLE",
    "AIRPLANE",
    "BUS",
    "TRAIN",
    "TRUCK",
    "BOAT",
    "TRAFFIC_LIGHT",
    "FIRE_HYDRANT",
    "STOP_SIGN",
    "PARKING_METER",
    "BENCH",
    "BIRD",
    "CAT",
    "DOG",
    "HORSE",
    "SHEEP",
    "COW",
    "ELEPHANT",
    "BEAR",
    "ZEBRA",
    "GIRAFFE",
    "BACKPACK",
    "UMBRELLA",
    "HANDBAG",
    "TIE",
    "SUITCASE",
    "FRISBEE",
    "SKIS",
    "SNOWBOARD",
    "SPORTS_BALL",
    "KITE",
    "BASEBALL_BAT",
    "BASEBALL_GLOVE",
    "SKATEBOARD",
    "SURFBOARD",
    "TENNIS_RACKET",
    "BOTTLE",
    "WINE_GLASS",
    "CUP",
    "FORK",
    "KNIFE",
    "SPOON",
    "BOWL",
    "BANANA",
    "APPLE",
    "SANDWICH",
    "ORANGE",
    "BROCCOLI",
    "CARROT",
    "HOT_DOG",
    "PIZZA",
    "DONUT",
    "CAKE",
    "CHAIR",
    "COUCH",
    "POTTED_PLANT",
    "BED",
    "DINING_TABLE",
    "TOILET",
    "TV",
    "LAPTOP",
    "MOUSE",
    "REMOTE",
    "KEYBOARD",
    "CELL_PHONE",
    "MICROWAVE",
    "OVEN",
    "TOASTER",
    "SINK",
    "REFRIGERATOR",
    "BOOK",
    "CLOCK",
    "VASE",
    "SCISSORS",
    "TEDDY_BEAR",
    "HAIR_DRIER",
    "TOOTHBRUSH",
    "FAKE_OBJ",
}

NEW_DETECTION_OBJECT_TYPE_VALUES = DETECTION_OBJECT_TYPE_VALUES | {"MOTION"}

TABLE_COLUMN_PAIRS = [
    TableColumnPair("perception_object_events", "object_type"),
    TableColumnPair("user_alert_settings", "detection_object_types", array_column=True),
]

ENUM_NAME = "detectionobjecttype"


def upgrade() -> None:
    change_enum_values(
        table_column_pairs=TABLE_COLUMN_PAIRS,
        enum_name=ENUM_NAME,
        current_values=DETECTION_OBJECT_TYPE_VALUES,
        new_values=NEW_DETECTION_OBJECT_TYPE_VALUES,
    )


def downgrade() -> None:
    change_enum_values(
        table_column_pairs=TABLE_COLUMN_PAIRS,
        enum_name=ENUM_NAME,
        current_values=NEW_DETECTION_OBJECT_TYPE_VALUES,
        new_values=DETECTION_OBJECT_TYPE_VALUES,
    )
