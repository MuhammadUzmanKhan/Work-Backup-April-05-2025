from backend.database import database, orm
from backend.database.face_models import NVRUniqueFaceCreate
from backend.database.models import NVR
from backend.s3_utils import S3Path
from backend.test.factory_types import RandomStringFactory


async def test_process_faces_batch_new(
    db_instance: database.Database,
    nvr: NVR,
    create_s3_url: RandomStringFactory,
    create_unique_face_id: RandomStringFactory,
) -> None:
    face_creates = [
        NVRUniqueFaceCreate(
            nvr_unique_face_id=create_unique_face_id(), s3_path=S3Path(create_s3_url())
        )
        for _ in range(10)
    ]
    async with db_instance.tenant_session(tenant=nvr.tenant) as session:
        await orm.NVRUniqueFace.process_faces_batch(
            session=session, nvr_uuid=nvr.uuid, faces=face_creates
        )

    # check that the faces were created (including the org faces)
    async with db_instance.tenant_session(tenant=nvr.tenant) as session:
        org_ids = await orm.NVRUniqueFace.get_org_unique_face_ids(
            session, [face.nvr_unique_face_id for face in face_creates]
        )
        assert len(org_ids) == len(face_creates)
        for org_id in org_ids:
            org_face = await orm.OrganizationUniqueFace.get_unique_face_by_id(
                session, org_unique_face_id=org_id
            )
            assert org_face is not None


async def test_process_faces_batch_existing(
    db_instance: database.Database,
    nvr: NVR,
    create_s3_url: RandomStringFactory,
    create_unique_face_id: RandomStringFactory,
) -> None:
    face_creates = [
        NVRUniqueFaceCreate(
            nvr_unique_face_id=create_unique_face_id(), s3_path=S3Path(create_s3_url())
        )
        for _ in range(10)
    ]
    async with db_instance.tenant_session(tenant=nvr.tenant) as session:
        await orm.NVRUniqueFace.process_faces_batch(
            session=session, nvr_uuid=nvr.uuid, faces=face_creates
        )

    # send the same faces again, but with a different s3 path
    face_creates = [
        NVRUniqueFaceCreate(
            nvr_unique_face_id=face.nvr_unique_face_id, s3_path=S3Path(create_s3_url())
        )
        for face in face_creates
    ]
    async with db_instance.tenant_session(tenant=nvr.tenant) as session:
        await orm.NVRUniqueFace.process_faces_batch(
            session=session, nvr_uuid=nvr.uuid, faces=face_creates
        )

    # check that the org faces have the latest s3 path
    async with db_instance.tenant_session(tenant=nvr.tenant) as session:
        org_ids = await orm.NVRUniqueFace.get_org_unique_face_ids(
            session, [face.nvr_unique_face_id for face in face_creates]
        )
        assert len(org_ids) == len(face_creates)
        for nvr_face, org_id in zip(face_creates, org_ids):
            org_face = await orm.OrganizationUniqueFace.get_unique_face_by_id(
                session, org_unique_face_id=org_id
            )
            assert org_face is not None
            assert org_face.s3_path == nvr_face.s3_path
