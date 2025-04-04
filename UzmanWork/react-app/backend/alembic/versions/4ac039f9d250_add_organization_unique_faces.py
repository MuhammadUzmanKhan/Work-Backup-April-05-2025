"""Add organization unique faces

Revision ID: 4ac039f9d250
Revises: b48217321a17
Create Date: 2024-03-06 14:39:22.806465

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "4ac039f9d250"
down_revision = "b48217321a17"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "organization_unique_faces",
        sa.Column("tenant", sa.String(), server_default="unassigned", nullable=False),
        sa.Column("id", sa.BIGINT(), nullable=False),
        sa.Column("s3_path", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    # populate the table from the existing unique_faces table
    # make every unique face in the unique_faces table an organization unique face
    op.execute(
        """
        INSERT INTO organization_unique_faces (tenant, s3_path)
        SELECT tenant, s3_path FROM unique_faces
        """
    )
    # point the unique face to the organization unique face
    op.add_column(
        "unique_faces", sa.Column("org_unique_face_id", sa.BIGINT(), nullable=True)
    )
    # use the s3_path to find the corresponding organization unique face
    # and set the foreign key
    op.execute(
        """
        UPDATE unique_faces
        SET org_unique_face_id = organization_unique_faces.id
        FROM organization_unique_faces
        WHERE unique_faces.tenant = organization_unique_faces.tenant
        AND unique_faces.s3_path = organization_unique_faces.s3_path
        """
    )
    # make the column not nullable
    op.alter_column("unique_faces", "org_unique_face_id", nullable=False)
    # enforce the foreign key
    op.create_foreign_key(
        "fk_unique_faces_org_unique_faces_org_unique_face_id",
        "unique_faces",
        "organization_unique_faces",
        ["org_unique_face_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # modify face_alert_profiles
    op.add_column(
        "face_alert_profiles",
        sa.Column("org_unique_face_id", sa.BIGINT(), nullable=True),
    )
    # populate the field from the existing unique_face_id
    op.execute(
        """
        UPDATE face_alert_profiles
        SET org_unique_face_id = unique_faces.org_unique_face_id
        FROM unique_faces
        WHERE face_alert_profiles.tenant = unique_faces.tenant
        AND face_alert_profiles.unique_face_id = unique_faces.unique_face_id
        """
    )
    # make the column not nullable
    op.alter_column("face_alert_profiles", "org_unique_face_id", nullable=False)
    # enforce the foreign key
    op.create_foreign_key(
        "fk_face_alert_profiles_org_unique_faces_org_unique_face_id",
        "face_alert_profiles",
        "organization_unique_faces",
        ["org_unique_face_id"],
        ["id"],
        ondelete="CASCADE",
    )
    # drop the reference to the unique_faces table
    op.drop_constraint(
        "fk_face_alert_profiles_unique_faces_unique_face_id",
        "face_alert_profiles",
        type_="foreignkey",
    )
    op.drop_column("face_alert_profiles", "unique_face_id")

    # add access control to the table
    op.execute("ALTER TABLE organization_unique_faces ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on organization_unique_faces
        USING (tenant = current_setting('app.tenant'));
        """
    )

    # rename unique_face_id to nvr_unique_face_id in unique_faces
    op.alter_column(
        "unique_faces", "unique_face_id", new_column_name="nvr_unique_face_id"
    )
    # rename unique_face_id to nvr_unique_face_id in face_occurrences
    op.alter_column(
        "face_occurrences", "unique_face_id", new_column_name="nvr_unique_face_id"
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # rename nvr_unique_face_id to unique_face_id in face_occurrences
    op.alter_column(
        "face_occurrences", "nvr_unique_face_id", new_column_name="unique_face_id"
    )
    # rename nvr_unique_face_id to unique_face_id in unique_faces
    op.alter_column(
        "unique_faces", "nvr_unique_face_id", new_column_name="unique_face_id"
    )
    op.add_column(
        "face_alert_profiles",
        sa.Column("unique_face_id", sa.VARCHAR(), autoincrement=False, nullable=True),
    )
    # populate the field from the existing org_unique_face_id
    # NOTE(@lberg): this is not a perfect downgrade, because unique_faces might have
    # been aggregated in the meantime
    op.execute(
        """
        UPDATE face_alert_profiles
        SET unique_face_id = unique_faces.unique_face_id
        FROM unique_faces
        WHERE face_alert_profiles.tenant = unique_faces.tenant
        AND face_alert_profiles.org_unique_face_id =
        unique_faces.org_unique_face_id
        """
    )
    # make the column not nullable
    op.alter_column("face_alert_profiles", "unique_face_id", nullable=False)
    # enforce the foreign key
    op.create_foreign_key(
        "fk_face_alert_profiles_unique_faces_unique_face_id",
        "face_alert_profiles",
        "unique_faces",
        ["unique_face_id"],
        ["unique_face_id"],
        ondelete="CASCADE",
    )

    # remove the org unique faces foreign key and the column
    op.drop_constraint(
        "fk_face_alert_profiles_org_unique_faces_org_unique_face_id",
        "face_alert_profiles",
        type_="foreignkey",
    )
    op.drop_column("face_alert_profiles", "org_unique_face_id")

    # unlink the unique faces from the organization unique faces
    op.drop_constraint(
        "fk_unique_faces_org_unique_faces_org_unique_face_id",
        "unique_faces",
        type_="foreignkey",
    )
    op.drop_column("unique_faces", "org_unique_face_id")
    # remove policy and row level security
    op.execute("ALTER TABLE organization_unique_faces DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation ON organization_unique_faces;")
    op.drop_table("organization_unique_faces")
    # ### end Alembic commands ###
