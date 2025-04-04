"""Rename AltaCredentials to AltaIntegration and introduce Alta Integration User

Revision ID: 291f053451db
Revises: 828d5eaed03c
Create Date: 2024-02-15 15:56:37.094962

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "291f053451db"
down_revision = "828d5eaed03c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.rename_table("alta_credentials", "alta_integrations")

    op.add_column(
        "alta_integrations", sa.Column("external_user_id", sa.Integer(), nullable=True)
    )
    op.add_column(
        "alta_integrations",
        sa.Column("cloud_key_credential_id", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("alta_integrations", "cloud_key_credential_id")
    op.drop_column("alta_integrations", "external_user_id")

    op.rename_table("alta_integrations", "alta_credentials")
