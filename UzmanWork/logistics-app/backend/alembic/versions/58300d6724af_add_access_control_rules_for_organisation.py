"""Add Access Control Rules for Organisation.

Revision ID: 58300d6724af
Revises: cdcca0bc5ccd
Create Date: 2024-01-10 16:06:44.992432

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "58300d6724af"
down_revision = "cdcca0bc5ccd"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.execute("ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on organizations
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.execute("ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on organizations;")
    # ### end Alembic commands ###
