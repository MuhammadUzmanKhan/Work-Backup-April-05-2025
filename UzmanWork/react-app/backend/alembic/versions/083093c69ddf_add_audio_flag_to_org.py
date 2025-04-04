"""Add audio flag to org and change access logs to be a string

Revision ID: 083093c69ddf
Revises: 3977bc6c8524
Create Date: 2024-03-01 14:18:35.272338

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "083093c69ddf"
down_revision = "3977bc6c8524"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "organizations",
        sa.Column(
            "cameras_audio_settings",
            sa.String(),
            server_default=sa.text("'disabled'"),
            nullable=False,
        ),
    )
    # for all orgs with feature flag set, set the new column to manual
    op.execute(
        "UPDATE organizations SET cameras_audio_settings = 'manual' WHERE"
        " organizations.tenant in (SELECT tenant FROM organization_features WHERE"
        " feature = 'AUDIO_ENABLED')"
    )
    # remove the feature flag
    op.execute("DELETE FROM organization_features WHERE feature = 'AUDIO_ENABLED'")
    # change access_logs.action to a string
    op.execute(
        "ALTER TABLE access_logs ALTER COLUMN action TYPE VARCHAR USING action::VARCHAR"
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # if the column is set to enabled, add the feature flag
    op.execute(
        "INSERT INTO organization_features (tenant, feature) SELECT tenant,"
        " 'AUDIO_ENABLED' FROM organizations WHERE organizations.cameras_audio_settings"
        " = 'enabled'"
    )
    op.drop_column("organizations", "cameras_audio_settings")
    # NOTE(@lberg): we don't restore the original type of the action column because
    # it makes no difference in the end, it can stay as a string.

    # ### end Alembic commands ###
