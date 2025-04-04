from backend.database import orm
from backend.database.session import TenantAwareAsyncSession
from backend.user_wall.models import SharedWallResponse, ShareInfo, WallResponse


async def get_walls_user_is_sharing(
    session: TenantAwareAsyncSession, user_email: str
) -> list[WallResponse]:
    """Helper function to collect all walls user is sharing."""
    walls = await orm.Wall.get_walls_owned(session, user_email)
    walls_user_is_sharing = await orm.SharedWall.get_walls_user_is_sharing(
        session, user_email
    )
    walls_user_is_sharing_response = []
    for wall in walls:
        wall_response = WallResponse(wall=wall, share_infos=[])
        for wall_user_is_sharing in walls_user_is_sharing:
            shared_with_user_email = wall_user_is_sharing.shared_with_user_email
            if wall_user_is_sharing.wall_id == wall.id:
                wall_response.share_infos.append(
                    ShareInfo(shared_with_user_email=shared_with_user_email)
                )
        walls_user_is_sharing_response.append(wall_response)
    return walls_user_is_sharing_response


async def get_walls_shared_with_user(
    session: TenantAwareAsyncSession, user_email: str
) -> list[SharedWallResponse]:
    """Helper function to collect all walls shared with user."""
    walls_shared_with_user = await orm.SharedWall.get_walls_shared_with_user(
        session, user_email
    )
    walls_shared_with_user_response = []
    for _, wall in walls_shared_with_user:
        shared_wall_response = SharedWallResponse(
            wall=wall, share_info=ShareInfo(shared_with_user_email=user_email)
        )
        walls_shared_with_user_response.append(shared_wall_response)
    return walls_shared_with_user_response
