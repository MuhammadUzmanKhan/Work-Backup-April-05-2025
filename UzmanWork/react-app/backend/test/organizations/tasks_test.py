from pydantic import BaseModel

from backend.database import database
from backend.organizations.tasks import _get_over_licensed_orgs
from backend.test.factory_types import (
    CameraFactory,
    CameraGroupFactory,
    NVRFactory,
    OrganizationFactory,
    RandomStringFactory,
)


async def _create_org_with_cameras(
    tenant: str,
    number_licensed_cameras: int | None,
    number_assigned_cameras: int,
    create_organization: OrganizationFactory,
    create_camera: CameraFactory,
    create_camera_group: CameraGroupFactory,
    create_nvr: NVRFactory,
) -> None:
    await create_organization(
        tenant=tenant, number_licensed_cameras=number_licensed_cameras
    )
    group = await create_camera_group(tenant=tenant)
    nvr = await create_nvr(location_id=None, tenant=tenant)
    for _ in range(number_assigned_cameras):
        await create_camera(camera_group_id=group.id, nvr_uuid=nvr.uuid, tenant=tenant)


class OrgConf(BaseModel):
    tenant: str
    num_licensed: int | None
    num_assigned: int


async def test_get_over_licensed_orgs(
    create_organization: OrganizationFactory,
    create_camera: CameraFactory,
    create_camera_group: CameraGroupFactory,
    create_nvr: NVRFactory,
    db_instance: database.Database,
    create_name: RandomStringFactory,
) -> None:
    expected_under = [
        OrgConf(tenant=create_name(), num_licensed=10, num_assigned=5),
        OrgConf(tenant=create_name(), num_licensed=None, num_assigned=40),
        OrgConf(tenant=create_name(), num_licensed=12, num_assigned=12),
    ]
    expected_over = [OrgConf(tenant=create_name(), num_licensed=5, num_assigned=15)]
    for conf in expected_under + expected_over:
        await _create_org_with_cameras(
            conf.tenant,
            conf.num_licensed,
            conf.num_assigned,
            create_organization,
            create_camera,
            create_camera_group,
            create_nvr,
        )

    over_licensed = await _get_over_licensed_orgs(db_instance)

    assert len(over_licensed) == len(expected_over)
    for conf, org in zip(expected_over, over_licensed):
        assert org.tenant == conf.tenant
        assert org.num_licensed_cameras == conf.num_licensed
        assert org.num_enabled_cameras == conf.num_assigned
