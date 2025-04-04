from datetime import timedelta

from backend.database import database, orm
from backend.database.models import Camera, MctImageCreate, TrackIdentifier
from backend.database.organization_models import Organization
from backend.utils import AwareDatetime


def generate_mct_image_batch(
    camera: Camera, start_time: AwareDatetime | None = None
) -> list[MctImageCreate]:
    start_time = start_time or AwareDatetime.utcnow() - timedelta(days=1)
    images = []
    for i in range(100):
        images.append(
            MctImageCreate(
                timestamp=start_time + timedelta(seconds=i),
                camera_mac_address=camera.mac_address,
                s3_path="s3://test/test.jpg",
                track_id=i,
                perception_stack_start_id="test",
            )
        )

    return images


async def test_add_mct_image_batch(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    mct_images = generate_mct_image_batch(camera)
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.MctImage.add_mct_image_batch(session, mct_images)


async def test_get_keys_already_in_db(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    mct_images = generate_mct_image_batch(camera)
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.MctImage.add_mct_image_batch(session, mct_images)
        keys = await orm.MctImage.get_keys_already_in_db(session, mct_images)
    assert len(keys) == len(mct_images)


async def test_get_track_thumbnail(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    mct_images = generate_mct_image_batch(camera)
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.MctImage.add_mct_image_batch(session, mct_images)
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        for mct_image in mct_images:
            mct_ret_image = await orm.MctImage.get_track_thumbnail(
                session,
                TrackIdentifier(
                    mac_address=mct_image.camera_mac_address,
                    track_id=mct_image.track_id,
                    perception_stack_start_id=mct_image.perception_stack_start_id,
                ),
                mct_image.timestamp,
            )
            assert mct_ret_image is not None
            assert mct_ret_image.s3_path == mct_image.s3_path


async def test_get_tracks_thumbnail(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    mct_images = generate_mct_image_batch(camera)
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.MctImage.add_mct_image_batch(session, mct_images)

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        tracks_image = await orm.MctImage.get_tracks_thumbnail(
            session,
            set(
                [
                    TrackIdentifier(
                        mac_address=mct_image.camera_mac_address,
                        track_id=mct_image.track_id,
                        perception_stack_start_id=mct_image.perception_stack_start_id,
                    )
                    for mct_image in mct_images
                ]
            ),
        )
    assert len(tracks_image) == len(mct_images)


async def test_get_tracks_thumbnail_duplicated(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    mct_images = generate_mct_image_batch(camera)
    # shift them by 1 timestamp
    mct_images_dups = generate_mct_image_batch(
        camera, start_time=mct_images[1].timestamp
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.MctImage.add_mct_image_batch(session, mct_images)
        await orm.MctImage.add_mct_image_batch(session, mct_images_dups)

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        tracks_image = await orm.MctImage.get_tracks_thumbnail(
            session,
            set(
                [
                    TrackIdentifier(
                        mac_address=mct_image.camera_mac_address,
                        track_id=mct_image.track_id,
                        perception_stack_start_id=mct_image.perception_stack_start_id,
                    )
                    for mct_image in mct_images
                ]
            ),
        )
    assert len(tracks_image) == len(mct_images)
