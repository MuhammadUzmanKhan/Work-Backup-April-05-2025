import pytest_asyncio

from backend import auth_models
from backend.database import database, orm
from backend.database.models import SharedWallCreate, Wall, WallCreate
from backend.database.organization_models import Organization


@pytest_asyncio.fixture
async def user_wall(
    db_instance: database.Database,
    organization: Organization,
    app_user: auth_models.AppUser,
) -> Wall:
    async with db_instance.tenant_session(tenant=app_user.tenant) as session:
        wall = await orm.Wall.create_wall(
            session, WallCreate(owner_user_email=app_user.user_email, name="wall_name")
        )

    return Wall.from_orm(wall)


async def test_get_walls_owned(
    db_instance: database.Database, user_wall: Wall, app_user: auth_models.AppUser
) -> None:
    async with db_instance.tenant_session(tenant=app_user.tenant) as session:
        walls_owned = await orm.Wall.get_walls_owned(
            session, user_wall.owner_user_email
        )
        assert len(walls_owned) == 1

        walls_owned = await orm.Wall.get_walls_owned(session, "non-existent-user")
        assert len(walls_owned) == 0

        walls_owned = await orm.Wall.get_walls_owned(session, "DEFAULT_USER_EMAIL")
        assert len(walls_owned) == 0


async def test_walls_user_is_sharing(
    db_instance: database.Database,
    user_wall: Wall,
    organization: Organization,
    app_user: auth_models.AppUser,
) -> None:
    async with db_instance.tenant_session(tenant=app_user.tenant) as session:
        user_email_2 = "test_user_2@testdomain.com"
        await orm.SharedWall.share_wall(
            session, SharedWallCreate(wall_id=1, shared_with_user_email=user_email_2)
        )

        walls_shared = await orm.SharedWall.get_walls_user_is_sharing(
            session, user_wall.owner_user_email
        )
        assert len(walls_shared) == 1

        walls_shared_with_right_user = await orm.SharedWall.get_walls_shared_with_user(
            session, user_email_2
        )
        assert len(walls_shared_with_right_user) == 1

        walls_shared_with_wrong_user = await orm.SharedWall.get_walls_shared_with_user(
            session, "non_existing_user"
        )
        assert len(walls_shared_with_wrong_user) == 0

        walls_shared_with_wrong_org = await orm.SharedWall.get_walls_shared_with_user(
            session, user_wall.owner_user_email
        )
        assert len(walls_shared_with_wrong_org) == 0


async def test_walls_user_is_sharing_full_access(
    db_instance: database.Database,
    user_wall: Wall,
    organization: Organization,
    app_user: auth_models.AppUser,
) -> None:
    async with db_instance.tenant_session(tenant=app_user.tenant) as session:
        user_email_2 = "test_user_2@testdomain.com"
        await orm.SharedWall.share_wall(
            session, SharedWallCreate(wall_id=1, shared_with_user_email=user_email_2)
        )

        walls_shared = await orm.SharedWall.get_walls_user_is_sharing(
            session, user_wall.owner_user_email
        )
        assert len(walls_shared) == 1

        walls_shared_with_right_user = await orm.SharedWall.get_walls_shared_with_user(
            session, user_email_2
        )
        assert len(walls_shared_with_right_user) == 1

        walls_shared_with_wrong_user = await orm.SharedWall.get_walls_shared_with_user(
            session, "non_existing_user"
        )
        assert len(walls_shared_with_wrong_user) == 0

        walls_shared_with_wrong_org = await orm.SharedWall.get_walls_shared_with_user(
            session, user_wall.owner_user_email
        )
        assert len(walls_shared_with_wrong_org) == 0
