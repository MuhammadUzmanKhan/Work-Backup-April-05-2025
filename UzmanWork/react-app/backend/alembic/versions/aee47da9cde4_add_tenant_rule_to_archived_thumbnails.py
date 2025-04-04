"""Add tenant rule to archived thumbnails

Revision ID: aee47da9cde4
Revises: a6f02983c0b6
Create Date: 2024-02-29 22:49:30.491240

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "aee47da9cde4"
down_revision = "a6f02983c0b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE archived_thumbnails ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on archived_thumbnails
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    op.execute("ALTER TABLE archived_thumbnails DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation ON archived_thumbnails;")
    # ### end Alembic commands ###
