"""Add Archive Tags

Revision ID: 7b8ed7cfaae7
Revises: 9ce22279da30
Create Date: 2024-04-11 14:22:04.879151

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "7b8ed7cfaae7"
down_revision = "9ce22279da30"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tags",
        sa.Column("tenant", sa.String(), server_default="unassigned", nullable=False),
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"]),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("LENGTH(name) >= 2", name="ck_name_min_length"),
    )

    op.execute(
        """
           CREATE UNIQUE INDEX uc_tag_name_per_tenant ON tags (tenant, lower(name));
       """
    )

    op.execute("ALTER TABLE tags ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
                CREATE POLICY tenant_isolation on tags
                USING (tenant = current_setting('app.tenant'));
                """
    )

    op.create_table(
        "archive_tags",
        sa.Column("archive_id", sa.Integer(), nullable=False),
        sa.Column("tag_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["archive_id"], ["archives.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("archive_id", "tag_id"),
    )


def downgrade() -> None:
    op.drop_table("archive_tags")
    op.drop_table("tags")
