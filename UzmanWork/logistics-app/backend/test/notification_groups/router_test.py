import pytest
from fastapi import status
from httpx import AsyncClient

from backend import auth_models
from backend.database import database, orm
from backend.database.models import (
    NotificationGroup,
    NotificationGroupMemberCreate,
    NotificationGroupMemberUpdate,
)
from backend.database.organization_models import Organization
from backend.database.orm.orm_notification_group import NotificationGroupError
from backend.notification_groups.models import (
    AddNotificationGroupMemberRequest,
    NotificationGroupsResponse,
    UpdateNotificationGroupMemberRequest,
)
from backend.test.client_request import (
    send_delete_request,
    send_get_request,
    send_post_request,
)
from backend.test.factory_types import (
    NotificationGroupFactory,
    NotificationGroupMemberFactory,
    RandomStringFactory,
)


async def test_add_notification_group(
    notification_group_client: AsyncClient, create_name: RandomStringFactory
) -> None:
    await send_get_request(notification_group_client, "new_group")


async def test_get_notification_groups(
    notification_group_client: AsyncClient,
    create_notification_groups: NotificationGroupFactory,
    app_user: auth_models.AppUser,
) -> None:
    # create notification groups
    num_groups = 3
    await create_notification_groups(tenant=app_user.tenant, num_groups=num_groups)

    response = await send_get_request(notification_group_client, "/")
    parsed_response = NotificationGroupsResponse.parse_obj(response.json())

    # Check that the response contains the correct number of notification groups
    assert len(parsed_response.notification_groups) == num_groups


async def test_rename_notification_group(
    notification_group_client: AsyncClient,
    app_user: auth_models.AppUser,
    notification_group: NotificationGroup,
    create_name: RandomStringFactory,
) -> None:
    # rename a notification group
    new_group_name = create_name()
    await send_post_request(
        notification_group_client,
        f"rename_group/{notification_group.id}",
        {"new_group_name": new_group_name},
    )

    # check that the notification group name is changed
    response = await send_get_request(notification_group_client, "/")
    parsed_response = NotificationGroupsResponse.parse_obj(response.json())
    assert len(parsed_response.notification_groups) == 1
    assert parsed_response.notification_groups[0].name == new_group_name


async def test_rename_notification_group_with_invalid_id(
    notification_group_client: AsyncClient,
    app_user: auth_models.AppUser,
    notification_group: NotificationGroup,
    create_name: RandomStringFactory,
) -> None:
    # rename a notification group
    new_group_name = create_name()
    await send_post_request(
        notification_group_client,
        f"rename_group/{notification_group.id + 1}",
        {"new_group_name": new_group_name},
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )


async def test_rename_notification_group_with_duplicate_name(
    notification_group_client: AsyncClient,
    create_notification_groups: NotificationGroupFactory,
    app_user: auth_models.AppUser,
) -> None:
    # create two notification groups
    notification_groups = await create_notification_groups(
        tenant=app_user.tenant, num_groups=2
    )

    # rename a notification group with a duplicate name
    await send_post_request(
        notification_group_client,
        f"rename_group/{notification_groups[0].id}",
        {"new_group_name": notification_groups[1].name},
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )


async def test_delete_notification_group(
    notification_group_client: AsyncClient,
    app_user: auth_models.AppUser,
    notification_group: NotificationGroup,
) -> None:
    # Delete the notification group
    await send_delete_request(
        notification_group_client, f"delete_group/{notification_group.id}"
    )
    response = await send_get_request(notification_group_client, "/")
    parsed_response = NotificationGroupsResponse.parse_obj(response.json())
    assert len(parsed_response.notification_groups) == 0


async def test_delete_notification_group_with_invalid_id(
    notification_group_client: AsyncClient,
    app_user: auth_models.AppUser,
    notification_group: NotificationGroup,
) -> None:
    # Delete the notification group
    await send_delete_request(
        notification_group_client,
        f"delete_group/{notification_group.id + 1}",
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )


@pytest.mark.parametrize(
    "user_name, email_address, phone_number",
    [
        # Complete information
        ("test_user", "test@gmail.com", "+12012222222"),
        # No user name
        (None, "test@gmail.com", "+12012222222"),
        # Only phone number
        (None, None, "+12012222222"),
        # Only Email address
        (None, "test@gmail.com", None),
    ],
)
async def test_add_notification_group_member(
    notification_group_client: AsyncClient,
    app_user: auth_models.AppUser,
    notification_group: NotificationGroup,
    user_name: str | None,
    email_address: str | None,
    phone_number: str | None,
) -> None:
    # Register a notification group member
    member = NotificationGroupMemberCreate(
        group_id=notification_group.id,
        user_name=user_name,
        email_address=email_address,
        phone_number=phone_number,
    )
    await send_post_request(
        notification_group_client,
        "new_group_member",
        AddNotificationGroupMemberRequest(notification_group_member=member),
    )

    response = await send_get_request(notification_group_client, "/")
    parsed_response = NotificationGroupsResponse.parse_obj(response.json())
    # Check that the response contains the correct notification group member
    assert len(parsed_response.notification_groups) == 1
    assert len(parsed_response.notification_groups[0].members) == 1
    assert (
        NotificationGroupMemberCreate(
            **parsed_response.notification_groups[0].members[0].dict()
        )
        == member
    )


@pytest.mark.parametrize(
    "user_name, email_address, phone_number",
    [
        # Invalid email information
        (None, "test.com", None),
        # User name + invalid email information
        ("test_user", "test.com", None),
    ],
)
async def test_add_notification_group_member_with_invalid_info(
    notification_group_client: AsyncClient,
    app_user: auth_models.AppUser,
    notification_group: NotificationGroup,
    user_name: str | None,
    email_address: str | None,
    phone_number: str | None,
) -> None:
    # Expect an error when adding a notification group member with invalid info
    with pytest.raises(ValueError):
        await send_post_request(
            notification_group_client,
            "new_group_member",
            AddNotificationGroupMemberRequest(
                notification_group_member=NotificationGroupMemberCreate(
                    group_id=notification_group.id,
                    user_name=user_name,
                    email_address=email_address,
                    phone_number=phone_number,
                )
            ),
        )


async def test_update_notification_group_member(
    notification_group_client: AsyncClient,
    app_user: auth_models.AppUser,
    notification_group_with_member: NotificationGroup,
) -> None:
    # Get the notification group member id
    group_member_id = notification_group_with_member.members[0].id

    # Update the notification group member
    update_group_member = NotificationGroupMemberUpdate(
        user_name="test_user2", email_address="test2@gmail.com"
    )
    await send_post_request(
        notification_group_client,
        f"update_group_member/{group_member_id}",
        UpdateNotificationGroupMemberRequest(
            notification_group_member=update_group_member
        ),
    )

    query_group_response = await send_get_request(notification_group_client, "/")
    parsed_response = NotificationGroupsResponse.parse_obj(query_group_response.json())
    # Check that the response contains the correct notification group member
    assert len(parsed_response.notification_groups) == 1
    assert len(parsed_response.notification_groups[0].members) == 1
    assert (
        NotificationGroupMemberUpdate(
            **parsed_response.notification_groups[0].members[0].dict()
        )
        == update_group_member
    )


async def test_delete_notification_group_member(
    notification_group_client: AsyncClient,
    app_user: auth_models.AppUser,
    notification_group: NotificationGroup,
    create_notification_group_with_members: NotificationGroupMemberFactory,
) -> None:
    members = []
    for email in ["test1@gmail.com", "test2@gmail.com", "test3@gmail.com"]:
        members.append(
            NotificationGroupMemberCreate(
                group_id=notification_group.id, email_address=email
            )
        )
    notification_groups = await create_notification_group_with_members(
        app_user.tenant, members
    )
    group_members_before_deletion = notification_groups[0].members

    # Delete a notification group member
    await send_delete_request(
        notification_group_client,
        f"delete_group_member/{group_members_before_deletion[1].id}",
    )
    # Expect two notification group members to exist after deletion
    response = await send_get_request(notification_group_client, "/")
    parsed_response = NotificationGroupsResponse.parse_obj(response.json())
    # Check that the response contains the correct notification group member
    assert len(parsed_response.notification_groups) == 1
    assert len(parsed_response.notification_groups[0].members) == 2
    group_members_after_deletion = parsed_response.notification_groups[0].members

    # Check that the correct notification group member is deleted
    assert group_members_after_deletion[0] == group_members_before_deletion[0]
    assert group_members_after_deletion[1] == group_members_before_deletion[2]


async def test_delete_notification_group_member_by_group_id(
    notification_group_client: AsyncClient,
    db_instance: database.Database,
    app_user: auth_models.AppUser,
    notification_group_with_member: NotificationGroup,
    organization: Organization,
) -> None:
    # Get the notification group member id
    group_member_id = notification_group_with_member.members[0].id

    # Delete the notification group
    await send_delete_request(
        notification_group_client, f"delete_group/{notification_group_with_member.id}"
    )

    # Expect the notification group member to be deleted when the notification group
    # is deleted and thus raises an error when querying the notification group member
    with pytest.raises(NotificationGroupError):
        async with db_instance.tenant_session(tenant=organization.tenant) as session:
            await orm.NotificationGroupMember.get_group_member_by_id_or_raise(
                session, group_member_id
            )
