"""add access control rules

Revision ID: 96489688a63f
Revises: 8a43a22167b3
Create Date: 2023-12-11 17:31:21.412572

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "96489688a63f"
down_revision = "8a43a22167b3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create new role and grant privileges
    # NOTE(@lberg): I have no idea why the role can already exist, but it does
    # happen in tests and is not deterministic.
    op.execute(
        """DO
    $$
    BEGIN
        IF not exists (SELECT * FROM pg_roles where rolname = 'tenant_user') THEN
        create role tenant_user;
    END IF;
    END
    $$;"""
    )

    op.execute("GRANT USAGE ON SCHEMA public TO tenant_user;")
    op.execute(
        "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO"
        " tenant_user;"
    )
    op.execute(
        """
        ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT SELECT, INSERT, UPDATE, DELETE
        ON TABLES TO tenant_user;
        """
    )
    op.execute("GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO tenant_user;")
    op.execute(
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO"
        " tenant_user;"
    )

    # add access control rules on tables
    # cameras
    op.execute("ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on cameras
        USING (tenant = current_setting('app.tenant'));
        """
    )

    # journey_requests
    op.execute("ALTER TABLE journey_requests ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on journey_requests
        USING (tenant = current_setting('app.tenant'));
        """
    )

    # license_plate_detections
    op.execute("ALTER TABLE license_plate_detections ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on license_plate_detections
        USING (tenant = current_setting('app.tenant'));
        """
    )

    # mct_images
    op.execute("ALTER TABLE mct_images ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on mct_images
        USING (tenant = current_setting('app.tenant'));
        """
    )

    # nvrs
    op.execute("ALTER TABLE nvrs ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on nvrs
        USING (tenant = current_setting('app.tenant'));
        """
    )

    # perception_object_events
    op.execute("ALTER TABLE perception_object_events ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on perception_object_events
        USING (tenant = current_setting('app.tenant'));
        """
    )

    # thumbnails
    op.execute("ALTER TABLE thumbnails ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on thumbnails
        USING (tenant = current_setting('app.tenant'));
        """
    )

    # unique_faces
    op.execute("ALTER TABLE unique_faces ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on unique_faces
        USING (tenant = current_setting('app.tenant'));
        """
    )

    # user_alert_settings
    op.execute("ALTER TABLE user_alert_settings ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on user_alert_settings
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # camera_groups
    op.execute("ALTER TABLE camera_groups ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on camera_groups
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # locations
    op.execute("ALTER TABLE locations ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on locations
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # text_search_requests
    op.execute("ALTER TABLE text_search_requests ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on text_search_requests
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # walls
    op.execute("ALTER TABLE walls ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on walls
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # organization_alert_subscribers
    op.execute("ALTER TABLE organization_alert_subscribers ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on organization_alert_subscribers
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # organization_features
    op.execute("ALTER TABLE organization_features ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on organization_features
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # kiosks
    op.execute("ALTER TABLE kiosks ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on kiosks
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # notification_groups
    op.execute("ALTER TABLE notification_groups ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on notification_groups
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # face_alert_profiles
    op.execute("ALTER TABLE face_alert_profiles ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on face_alert_profiles
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # brivo_tokens
    op.execute("ALTER TABLE brivo_tokens ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on brivo_tokens
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # archives
    op.execute("ALTER TABLE archives ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on archives
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # alta_credentials
    op.execute("ALTER TABLE alta_credentials ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on alta_credentials
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # access_logs
    op.execute("ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on access_logs
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # access_points
    op.execute("ALTER TABLE access_points ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on access_points
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # license_plate_alert_profiles
    op.execute("ALTER TABLE license_plate_alert_profiles ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on license_plate_alert_profiles
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # archive_comments
    op.execute("ALTER TABLE archive_comments ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on archive_comments
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # clips_data
    op.execute("ALTER TABLE clips_data ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on clips_data
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # embedding_responses
    op.execute("ALTER TABLE embedding_responses ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on embedding_responses
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # face_occurrences
    op.execute("ALTER TABLE face_occurrences ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on face_occurrences
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # journey_responses
    op.execute("ALTER TABLE journey_responses ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on journey_responses
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # notification_group_members
    op.execute("ALTER TABLE notification_group_members ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on notification_group_members
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # shared_archives
    op.execute("ALTER TABLE shared_archives ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on shared_archives
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # shared_videos
    op.execute("ALTER TABLE shared_videos ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on shared_videos
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # shared_walls
    op.execute("ALTER TABLE shared_walls ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on shared_walls
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # text_search_response
    op.execute("ALTER TABLE text_search_response ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on text_search_response
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # text_search_response_status
    op.execute("ALTER TABLE text_search_response_status ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on text_search_response_status
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # user_alerts
    op.execute("ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on user_alerts
        USING (tenant = current_setting('app.tenant'));
        """
    )
    # wall_tiles
    op.execute("ALTER TABLE wall_tiles ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY tenant_isolation on wall_tiles
        USING (tenant = current_setting('app.tenant'));
        """
    )

    # ### end Alembic commands ###


def downgrade() -> None:
    # Remove access control rules on all tables
    # cameras
    op.execute("ALTER TABLE cameras DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on cameras;")
    # journey_requests
    op.execute("ALTER TABLE journey_requests DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on journey_requests;")
    # license_plate_detections
    op.execute("ALTER TABLE license_plate_detections DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on license_plate_detections;")
    # mct_images
    op.execute("ALTER TABLE mct_images DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on mct_images;")
    # nvrs
    op.execute("ALTER TABLE nvrs DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on nvrs;")
    # perception_object_events
    op.execute("ALTER TABLE perception_object_events DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on perception_object_events;")
    # thumbnails
    op.execute("ALTER TABLE thumbnails DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on thumbnails;")
    # unique_faces
    op.execute("ALTER TABLE unique_faces DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on unique_faces;")
    # user_alert_settings
    op.execute("ALTER TABLE user_alert_settings DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on user_alert_settings;")
    # camera_groups
    op.execute("ALTER TABLE camera_groups DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on camera_groups;")
    # locations
    op.execute("ALTER TABLE locations DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on locations;")
    # text_search_requests
    op.execute("ALTER TABLE text_search_requests DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on text_search_requests;")
    # walls
    op.execute("ALTER TABLE walls DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on walls;")
    # organization_alert_subscribers
    op.execute("ALTER TABLE organization_alert_subscribers DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on organization_alert_subscribers;")
    # organization_features
    op.execute("ALTER TABLE organization_features DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on organization_features;")
    # kiosks
    op.execute("ALTER TABLE kiosks DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on kiosks;")
    # notification_groups
    op.execute("ALTER TABLE notification_groups DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on notification_groups;")
    # face_alert_profiles
    op.execute("ALTER TABLE face_alert_profiles DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on face_alert_profiles;")
    # brivo_tokens
    op.execute("ALTER TABLE brivo_tokens DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on brivo_tokens;")
    # archives
    op.execute("ALTER TABLE archives DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on archives;")
    # alta_credentials
    op.execute("ALTER TABLE alta_credentials DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on alta_credentials;")
    # access_logs
    op.execute("ALTER TABLE access_logs DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on access_logs;")
    # access_points
    op.execute("ALTER TABLE access_points DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on access_points;")
    # license_plate_alert_profiles
    op.execute("ALTER TABLE license_plate_alert_profiles DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on license_plate_alert_profiles;")
    # archive_comments
    op.execute("ALTER TABLE archive_comments DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on archive_comments;")
    # clips_data
    op.execute("ALTER TABLE clips_data DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on clips_data;")
    # embedding_responses
    op.execute("ALTER TABLE embedding_responses DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on embedding_responses;")
    # face_occurrences
    op.execute("ALTER TABLE face_occurrences DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on face_occurrences;")
    # journey_responses
    op.execute("ALTER TABLE journey_responses DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on journey_responses;")
    # notification_group_members
    op.execute("ALTER TABLE notification_group_members DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on notification_group_members;")
    # shared_archives
    op.execute("ALTER TABLE shared_archives DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on shared_archives;")
    # shared_videos
    op.execute("ALTER TABLE shared_videos DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on shared_videos;")
    # shared_walls
    op.execute("ALTER TABLE shared_walls DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on shared_walls;")
    # text_search_response
    op.execute("ALTER TABLE text_search_response DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on text_search_response;")
    # text_search_response_status
    op.execute("ALTER TABLE text_search_response_status DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on text_search_response_status;")
    # user_alerts
    op.execute("ALTER TABLE user_alerts DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on user_alerts;")
    # wall_tiles
    op.execute("ALTER TABLE wall_tiles DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on wall_tiles;")

    # Revoke access and drop role
    op.execute("REVOKE USAGE ON ALL SEQUENCES IN SCHEMA public FROM tenant_user;")
    op.execute(
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE USAGE ON SEQUENCES FROM"
        " tenant_user;"
    )
    op.execute(
        "REVOKE SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM"
        " tenant_user;"
    )
    op.execute(
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT, INSERT, UPDATE,"
        " DELETE ON TABLES FROM tenant_user;"
    )
    op.execute("REVOKE USAGE ON SCHEMA public FROM tenant_user;")
    op.execute("DROP ROLE tenant_user;")
    # ### end Alembic commands ###
