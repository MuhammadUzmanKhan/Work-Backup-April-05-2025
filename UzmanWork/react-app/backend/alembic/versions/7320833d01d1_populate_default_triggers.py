"""Populate default triggers

Revision ID: 7320833d01d1
Revises: 6229390f84b3
Create Date: 2024-02-06 17:50:20.328595

"""

import sqlalchemy as sa
from alembic import op

from backend.constants import (
    DO_NOT_ENTER_ALERT_MAX_DURATION,
    IDLE_ALERT_MAX_DURATION,
    MIN_ACTIVE_DURATION,
)
from backend.database.models import TriggerType

# revision identifiers, used by Alembic.
revision = "7320833d01d1"
down_revision = "6229390f84b3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    stmt = (
        "INSERT INTO user_alert_trigger_types (trigger_type, min_active_duration_s,"
        f" max_idle_duration_s) VALUES ('{TriggerType.DO_NOT_ENTER.name}',"
        f" {MIN_ACTIVE_DURATION.total_seconds()},"
        f" {DO_NOT_ENTER_ALERT_MAX_DURATION.total_seconds()}),"
        f" ('{TriggerType.IDLING.name}', {MIN_ACTIVE_DURATION.total_seconds()},"
        f" {IDLE_ALERT_MAX_DURATION.total_seconds()}) ON CONFLICT DO NOTHING"
    )
    op.execute(sa.text(stmt))


def downgrade() -> None:
    stmt = (
        "DELETE FROM user_alert_trigger_types "
        "WHERE trigger_type IN "
        f"('{TriggerType.DO_NOT_ENTER.name}', '{TriggerType.IDLING.name}')"
    )
    op.execute(sa.text(stmt))
