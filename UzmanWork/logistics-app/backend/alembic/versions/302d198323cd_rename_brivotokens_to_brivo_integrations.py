"""Rename BrivoTokens_to_BrivoIntegrations

Revision ID: 302d198323cd
Revises: 291f053451db
Create Date: 2024-02-19 16:53:37.094232

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "302d198323cd"
down_revision = "291f053451db"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.rename_table("brivo_tokens", "brivo_integrations")


def downgrade() -> None:
    op.rename_table("brivo_integrations", "brivo_tokens")
