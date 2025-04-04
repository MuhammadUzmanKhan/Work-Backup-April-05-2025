from backend.database import database, models, orm
from backend.database.models import Camera
from backend.database.organization_models import Organization
from backend.utils import AwareDatetime


def generate_license_plates(camera: Camera) -> list[models.LicensePlateDetectionCreate]:
    """Util function to generate a list of license plate detections."""
    return [
        models.LicensePlateDetectionCreate(
            time=AwareDatetime.from_datetime_str("2023-07-01T01:00:01.000+0000"),
            license_plate_number="LP-123",
            score=0.8,
            dscore=0.9,
            vscore=0.9,
            mac_address=camera.mac_address,
            perception_stack_start_id="perception_stack_start_id_1",
            object_id=2,
            track_id=12,
            image_s3_path="s3://orcamobility-lpr-images-dev/image1.jpg",
            x_min=0.0,
            y_min=0.0,
            x_max=1.0,
            y_max=1.0,
        ),
        models.LicensePlateDetectionCreate(
            time=AwareDatetime.from_datetime_str("2023-07-01T01:00:02.000+0000"),
            license_plate_number="LP-124",
            score=0.9,
            dscore=0.9,
            vscore=0.9,
            mac_address=camera.mac_address,
            perception_stack_start_id="perception_stack_start_id_1",
            object_id=7,
            track_id=12,
            image_s3_path="s3://orcamobility-lpr-images-dev/image2.jpg",
            x_min=0.0,
            y_min=0.0,
            x_max=1.0,
            y_max=1.0,
        ),
        models.LicensePlateDetectionCreate(
            time=AwareDatetime.from_datetime_str("2023-07-01T01:00:03.000+0000"),
            license_plate_number="LP-321",
            score=0.95,
            dscore=0.9,
            vscore=0.9,
            mac_address=camera.mac_address,
            perception_stack_start_id="perception_stack_start_id_1",
            object_id=2,
            track_id=47,
            image_s3_path="s3://orcamobility-lpr-thumbnails-dev/image3.jpg",
            x_min=0.0,
            y_min=0.0,
            x_max=1.0,
            y_max=1.0,
        ),
        models.LicensePlateDetectionCreate(
            time=AwareDatetime.from_datetime_str("2023-07-01T01:00:04.000+0000"),
            license_plate_number="LP-322",
            score=0.4,
            dscore=0.9,
            vscore=0.9,
            mac_address=camera.mac_address,
            perception_stack_start_id="perception_stack_start_id_1",
            object_id=1,
            track_id=47,
            image_s3_path="s3://orcamobility-lpr-thumbnails-dev/image4.jpg",
            x_min=0.0,
            y_min=0.0,
            x_max=1.0,
            y_max=1.0,
        ),
        models.LicensePlateDetectionCreate(
            time=AwareDatetime.from_datetime_str("2023-07-01T01:00:05.000+0000"),
            license_plate_number="LP-124",
            score=0.7,
            dscore=0.9,
            vscore=0.9,
            mac_address=camera.mac_address,
            perception_stack_start_id="perception_stack_start_id_1",
            object_id=7,
            track_id=17,
            image_s3_path="s3://orcamobility-lpr-thumbnails-dev/image5.jpg",
            x_min=0.0,
            y_min=0.0,
            x_max=1.0,
            y_max=1.0,
        ),
    ]


async def test_get_license_plates_tracks(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    """Test if aggregation capability works."""

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        for detection_metadata in generate_license_plates(camera):
            await orm.LicensePlate.system_get_or_create(
                session=session,
                license_plate_metadata=models.LicensePlate(
                    license_plate_number=detection_metadata.license_plate_number
                ),
            )
            await orm.LicensePlateDetection.add_detection(
                session=session, detection_metadata=detection_metadata
            )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        detections = await orm.LicensePlateDetection.get_track_info(
            session=session,
            start_time=AwareDatetime.from_datetime_str("2023-07-01T01:00:00.000+0000"),
            end_time=AwareDatetime.from_datetime_str("2023-07-01T01:00:06.000+0000"),
            mac_addresses={camera.mac_address},
        )
    assert len(detections) == 2
    assert detections[0].license_plate_number == "LP-124"
    assert detections[0].camera_name == camera.name
    assert detections[1].license_plate_number == "LP-321"
    assert detections[1].camera_name == camera.name


async def test_get_license_plates(
    db_instance: database.Database, camera: Camera
) -> None:
    """Test if get license plates works."""

    async with db_instance.session() as session:
        for detection_metadata in generate_license_plates(camera):
            await orm.LicensePlate.system_get_or_create(
                session=session,
                license_plate_metadata=models.LicensePlate(
                    license_plate_number=detection_metadata.license_plate_number
                ),
            )
        license_plates = await orm.LicensePlate.system_get_all(session=session)
        license_plate_numbers = {lp.license_plate_number for lp in license_plates}
        assert {"LP-123", "LP-124", "LP-321", "LP-322"} == license_plate_numbers
