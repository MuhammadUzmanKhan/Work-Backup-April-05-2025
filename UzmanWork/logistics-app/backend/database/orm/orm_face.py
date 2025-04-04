from __future__ import annotations

from typing import TypedDict

import sqlalchemy as sa
from sqlalchemy import orm
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import face_models
from backend.database.models import ResourceRetentionData
from backend.database.orm import orm_nvr
from backend.database.orm.orm_utils import TenantProtectedTable, bulk_insert_with_ids
from backend.database.session import TenantAwareAsyncSession
from backend.s3_utils import S3Path
from backend.utils import AwareDatetime


class OrmFaceError(Exception):
    pass


class OrganizationUniqueFaceNotFoundError(OrmFaceError):
    pass


class OrganizationUniqueFaceUpdateError(OrmFaceError):
    pass


class OrganizationUniqueFace(TenantProtectedTable):
    __tablename__ = "organization_unique_faces"
    # The unique face ID
    id: orm.Mapped[int] = sa.Column(sa.BIGINT, primary_key=True)
    # The S3 path of the unique face image
    s3_path = sa.Column(sa.String, nullable=False)

    @staticmethod
    async def get_unique_face_by_id(
        session: TenantAwareAsyncSession, org_unique_face_id: int
    ) -> OrganizationUniqueFace | None:
        query = sa.select(OrganizationUniqueFace).where(
            OrganizationUniqueFace.id == org_unique_face_id
        )
        result = await session.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def match_s3_path(
        session: TenantAwareAsyncSession, org_unique_face_id: int, s3_path: str
    ) -> bool:
        query = sa.select(OrganizationUniqueFace).where(
            OrganizationUniqueFace.id == org_unique_face_id,
            OrganizationUniqueFace.s3_path == s3_path,
        )
        result = await session.execute(query)
        return result.scalar_one_or_none() is not None

    @staticmethod
    async def update_s3_path(
        session: TenantAwareAsyncSession, org_unique_face_id: int, s3_path: str
    ) -> None:
        row_count = (
            await session.execute(
                sa.update(OrganizationUniqueFace)
                .where(OrganizationUniqueFace.id == org_unique_face_id)
                .values(s3_path=s3_path)
            )
        ).rowcount  # type: ignore
        if row_count != 1:
            raise OrganizationUniqueFaceUpdateError(
                f"Expected to update 1 row, but updated {row_count} rows for"
                f" {org_unique_face_id=}."
            )

    @staticmethod
    async def create_unique_face(session: TenantAwareAsyncSession, s3_path: str) -> int:
        unique_face = OrganizationUniqueFace(s3_path=s3_path, tenant=session.tenant)
        session.add(unique_face)
        await session.flush()
        return unique_face.id

    @staticmethod
    async def get_latest_unique_face_occurrences(
        session: TenantAwareAsyncSession,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        location_ids: set[int],
        mac_addresses: set[str],
        org_unique_face_ids: set[int] | None = None,
    ) -> list[face_models.UniqueFaceOccurrence]:
        # Create where clauses
        where_clauses: list[sa.sql.ClauseElement] = [
            orm_nvr.NVR.location_id.in_(location_ids),
            FaceOccurrence.mac_address.in_(mac_addresses),
            FaceOccurrence.occurrence_time >= start_time,
            FaceOccurrence.occurrence_time <= end_time,
        ]
        if org_unique_face_ids is not None:
            where_clauses.append(OrganizationUniqueFace.id.in_(org_unique_face_ids))

        # Build the query to get the latest occurrence time for each unique face
        # in interest.
        query = (
            sa.select(
                OrganizationUniqueFace.id.label("org_unique_face_id"),
                OrganizationUniqueFace.s3_path,
                FaceOccurrence.occurrence_time,
                FaceOccurrence.mac_address,
            )
            .join(
                NVRUniqueFace,
                FaceOccurrence.nvr_unique_face_id == NVRUniqueFace.nvr_unique_face_id,
            )
            .join(
                OrganizationUniqueFace,
                NVRUniqueFace.org_unique_face_id == OrganizationUniqueFace.id,
            )
            .join(orm_nvr.NVR, FaceOccurrence.nvr_uuid == orm_nvr.NVR.uuid)
            .where(*where_clauses)
            .distinct(OrganizationUniqueFace.id)
            .order_by(OrganizationUniqueFace.id, FaceOccurrence.occurrence_time.desc())
        )

        result = await session.execute(query)
        rows = result.all()

        results = [face_models.UniqueFaceOccurrence.from_orm(row) for row in rows]
        # Sort the results by latest occurrence time first
        results.sort(key=lambda x: x.occurrence_time, reverse=True)
        return results

    @staticmethod
    async def merge_faces(
        session: TenantAwareAsyncSession, faces_merge: face_models.OrgUniqueFacesMerge
    ) -> None:
        """Update all nvr unique faces using
        the same org_unique_face_id of the source unique face ID
        to use the org_unique_face_id of the destination unique face ID
        """

        await session.execute(
            sa.update(NVRUniqueFace)
            .where(
                NVRUniqueFace.org_unique_face_id == faces_merge.org_unique_face_id_src
            )
            .values(org_unique_face_id=faces_merge.org_unique_face_id_dst)
        )

    @staticmethod
    async def delete_unique_face(
        session: TenantAwareAsyncSession, org_unique_face_id: int
    ) -> None:
        await session.execute(
            sa.delete(OrganizationUniqueFace).where(
                OrganizationUniqueFace.id == org_unique_face_id
            )
        )


class NVRUniqueFace(TenantProtectedTable):
    __tablename__ = "unique_faces"
    # The unique face ID
    nvr_unique_face_id = sa.Column(sa.String, primary_key=True, unique=True)
    # NVR this face is associated with
    nvr_uuid = sa.Column(sa.String, sa.ForeignKey("nvrs.uuid"), primary_key=True)
    # The S3 path of the unique face image, e.g.
    # "s3://bucket/path/to/unique_face.jpg"
    s3_path = sa.Column(sa.String, nullable=False)
    # The organization this unique face is associated with
    # This allows to link multiple unique faces to the same one in the organization
    org_unique_face_id = sa.Column(
        sa.BIGINT,
        sa.ForeignKey("organization_unique_faces.id", ondelete="CASCADE"),
        nullable=False,
    )

    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def _update_existing_face(
        session: TenantAwareAsyncSession,
        face_create: face_models.NVRUniqueFaceCreate,
        org_unique_face_id: int,
        current_s3_path: str,
    ) -> None:
        await session.execute(
            sa.update(NVRUniqueFace)
            .where(NVRUniqueFace.nvr_unique_face_id == face_create.nvr_unique_face_id)
            .values(s3_path=face_create.s3_path)
        )

        # Our current logic is that the NVR face that has the same S3 path for
        # the face image as the org face is the "main" face for the org face. So
        # when its image is updated, we also update the image of the org face.
        if await OrganizationUniqueFace.match_s3_path(
            session, org_unique_face_id, current_s3_path
        ):
            await OrganizationUniqueFace.update_s3_path(
                session, org_unique_face_id, face_create.s3_path
            )

    @staticmethod
    async def _add_new_face(
        session: TenantAwareAsyncSession,
        face: face_models.NVRUniqueFaceCreate,
        nvr_uuid: str,
    ) -> NVRUniqueFace:
        org_unique_face_id = await OrganizationUniqueFace.create_unique_face(
            session, face.s3_path
        )
        unique_face = NVRUniqueFace(
            nvr_unique_face_id=face.nvr_unique_face_id,
            nvr_uuid=nvr_uuid,
            s3_path=face.s3_path,
            org_unique_face_id=org_unique_face_id,
            tenant=session.tenant,
        )
        session.add(unique_face)
        return unique_face

    @staticmethod
    async def process_faces_batch(
        session: TenantAwareAsyncSession,
        faces: list[face_models.NVRUniqueFaceCreate],
        nvr_uuid: str,
    ) -> None:
        # Faces can be re-uploaded to improve the image, so we need to update
        # the S3 path of the existing faces. We might also need to update the
        # organization_unique_face.
        existing_faces_query = await session.execute(
            sa.select(
                NVRUniqueFace.org_unique_face_id,
                NVRUniqueFace.nvr_unique_face_id,
                NVRUniqueFace.s3_path,
            ).where(
                NVRUniqueFace.nvr_unique_face_id.in_(
                    [f.nvr_unique_face_id for f in faces]
                )
            )
        )
        ExistingFaceData = TypedDict(
            "ExistingFaceData", {"org_face_id": int, "s3_path": str}
        )
        existing_faces: dict[str, ExistingFaceData] = {
            face.nvr_unique_face_id: {
                "org_face_id": face.org_unique_face_id,
                "s3_path": face.s3_path,
            }
            for face in existing_faces_query.all()
        }
        for face in faces:
            if face.nvr_unique_face_id in existing_faces:
                face_data = existing_faces[face.nvr_unique_face_id]
                await NVRUniqueFace._update_existing_face(
                    session,
                    face_create=face,
                    org_unique_face_id=face_data["org_face_id"],
                    current_s3_path=face_data["s3_path"],
                )
            else:
                await NVRUniqueFace._add_new_face(session, face, nvr_uuid)
        await session.flush()

    @staticmethod
    async def get_org_unique_face_ids(
        session: TenantAwareAsyncSession, nvr_unique_face_ids: list[str]
    ) -> list[int]:
        query = (
            sa.select(
                OrganizationUniqueFace.id.label("org_unique_face_id"),
                NVRUniqueFace.nvr_unique_face_id,
            )
            .join(
                OrganizationUniqueFace,
                NVRUniqueFace.org_unique_face_id == OrganizationUniqueFace.id,
            )
            .where(NVRUniqueFace.nvr_unique_face_id.in_(nvr_unique_face_ids))
        )

        mapping = {
            row.nvr_unique_face_id: row.org_unique_face_id
            for row in (await session.execute(query)).all()
        }
        results = []
        for nvr_unique_face_id in nvr_unique_face_ids:
            if nvr_unique_face_id not in mapping:
                raise OrganizationUniqueFaceNotFoundError(
                    f"Face with id {nvr_unique_face_id} not found"
                )
            results.append(mapping[nvr_unique_face_id])
        return results

    @staticmethod
    async def get_missing_unique_face_ids(
        session: TenantAwareAsyncSession, nvr_unique_face_ids: set[str]
    ) -> set[str]:
        query = sa.select(NVRUniqueFace.nvr_unique_face_id).where(
            NVRUniqueFace.nvr_unique_face_id.in_(nvr_unique_face_ids)
        )
        existing_ids = {row[0] for row in await session.execute(query)}
        return nvr_unique_face_ids - existing_ids

    @staticmethod
    async def does_org_face_have_nvr_face(
        session: TenantAwareAsyncSession, org_unique_face_id: int
    ) -> bool:
        query = sa.select(NVRUniqueFace.nvr_unique_face_id).where(
            NVRUniqueFace.org_unique_face_id == org_unique_face_id
        )
        result = await session.execute(query)
        return result.scalar_one_or_none() is not None

    @staticmethod
    async def process_user_uploaded_face(
        session: TenantAwareAsyncSession,
        face: face_models.NVRUniqueFaceFromUploadCreate,
        nvr_uuid: str,
    ) -> NVRUniqueFace:
        unique_face = NVRUniqueFace(
            nvr_unique_face_id=face.nvr_unique_face_id,
            nvr_uuid=nvr_uuid,
            s3_path=face.s3_path,
            org_unique_face_id=face.org_unique_face_id,
            tenant=session.tenant,
        )
        session.add(unique_face)
        return unique_face


class FaceOccurrence(TenantProtectedTable):
    __tablename__ = "face_occurrences"
    id: orm.Mapped[int] = sa.Column(sa.BigInteger, primary_key=True, autoincrement=True)
    # The unique face ID (first part of the foreign key)
    # NOTE(@lberg): face occurrences always refer to an NVR unique face
    nvr_unique_face_id = sa.Column(
        sa.String,
        sa.ForeignKey("unique_faces.nvr_unique_face_id", ondelete="CASCADE"),
        nullable=False,
    )
    # NVR this face is associated with (second part of the foreign key)
    nvr_uuid = sa.Column(sa.String, sa.ForeignKey("nvrs.uuid"), nullable=False)
    # The camera mac address
    mac_address = sa.Column(
        sa.String,
        sa.ForeignKey("cameras.mac_address", ondelete="CASCADE"),
        nullable=False,
    )
    # The time this face was detected
    occurrence_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # The index of the object in a given frame, together with the timestamp
    # (occurrence_time) uniquely identifies a detection.
    # This is None if this face was not associated to a track.
    pcp_idx_in_frame = sa.Column(sa.Integer, nullable=True)
    # The S3 path of the face image, if any, e.g.
    # "s3://bucket/path/to/face.jpg"
    face_s3_path = sa.Column(sa.String, nullable=True)
    # The S3 path of the image of the person at occurrence_time, if any, e.g.
    # "s3://bucket/path/to/person.jpg"
    person_s3_path = sa.Column(sa.String, nullable=True)
    # The sharpness score of the face image. The higher the score, the sharper.
    face_sharpness = sa.Column(sa.Float, nullable=False, default=0.0)
    # Constraints
    __table_args__ = (
        # Set up composite index key to occurrence_time and mac_address
        sa.Index("face_occurrence_time_mac_address_idx", mac_address, occurrence_time),
        sa.Index(
            "face_occurrence_time_mac_address_unique_face_id_idx",
            nvr_unique_face_id,
            mac_address,
            occurrence_time,
        ),
        sa.Index(
            "idx_face_occurrence_with_tenant_queries",
            "tenant",
            nvr_unique_face_id,
            mac_address,
            occurrence_time,
        ),
    )

    @staticmethod
    async def add_occurrences_batch(
        session: TenantAwareAsyncSession,
        occurrences: list[face_models.FaceOccurrenceCreate],
        nvr_uuid: str,
    ) -> list[face_models.FaceOccurrence]:
        occurrences_list = [
            dict(
                nvr_unique_face_id=o.nvr_unique_face_id,
                nvr_uuid=nvr_uuid,
                mac_address=o.camera_mac_address,
                occurrence_time=o.occurrence_time,
                pcp_idx_in_frame=o.pcp_idx_in_frame,
                face_s3_path=o.face_s3_path,
                person_s3_path=o.person_s3_path,
                face_sharpness=o.face_sharpness,
                tenant=session.tenant,
            )
            for o in occurrences
        ]
        ids = await bulk_insert_with_ids(
            session, FaceOccurrence, occurrences_list, id_column=FaceOccurrence.id
        )
        org_ids = await NVRUniqueFace.get_org_unique_face_ids(
            session, [o.nvr_unique_face_id for o in occurrences]
        )
        return [
            face_models.FaceOccurrence.parse_obj(
                {**occ.dict(), "id": id, "org_unique_face_id": org_id}
            )
            for occ, id, org_id in zip(occurrences, ids, org_ids)
        ]

    @staticmethod
    async def get_face_occurrences(
        session: TenantAwareAsyncSession,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        org_unique_face_ids: set[int],
        location_ids: set[int],
        mac_addresses: set[str],
    ) -> list[face_models.FaceOccurrence]:
        query = (
            sa.select(
                OrganizationUniqueFace.id.label("org_unique_face_id"),
                FaceOccurrence.occurrence_time,
                FaceOccurrence.pcp_idx_in_frame,
                FaceOccurrence.face_s3_path,
                FaceOccurrence.person_s3_path,
                FaceOccurrence.face_sharpness,
                FaceOccurrence.mac_address.label("camera_mac_address"),
                NVRUniqueFace.nvr_unique_face_id,
                FaceOccurrence.id,
            )
            .join(
                NVRUniqueFace,
                FaceOccurrence.nvr_unique_face_id == NVRUniqueFace.nvr_unique_face_id,
            )
            .join(
                OrganizationUniqueFace,
                NVRUniqueFace.org_unique_face_id == OrganizationUniqueFace.id,
            )
            .join(orm_nvr.NVR, FaceOccurrence.nvr_uuid == orm_nvr.NVR.uuid)
            .where(
                FaceOccurrence.occurrence_time >= start_time,
                FaceOccurrence.occurrence_time <= end_time,
                OrganizationUniqueFace.id.in_(org_unique_face_ids),
                FaceOccurrence.mac_address.in_(mac_addresses),
                orm_nvr.NVR.location_id.in_(location_ids),
            )
            .order_by(
                FaceOccurrence.nvr_unique_face_id, FaceOccurrence.occurrence_time.desc()
            )
        )

        result = await session.execute(query)
        return [face_models.FaceOccurrence.from_orm(row) for row in result.all()]

    @staticmethod
    async def system_get_retention_data_for_camera(
        session: AsyncSession,
        mac_address: str,
        end_time: AwareDatetime,
        limit: int | None,
    ) -> list[ResourceRetentionData]:
        query = (
            sa.select(
                FaceOccurrence.face_s3_path,
                FaceOccurrence.person_s3_path,
                FaceOccurrence.occurrence_time,
            )
            .where(FaceOccurrence.occurrence_time <= end_time)
            .where(FaceOccurrence.mac_address == mac_address)
            .order_by(FaceOccurrence.occurrence_time.asc())
        )
        if limit is not None:
            query = query.limit(limit)

        result = await session.execute(query)
        data: list[ResourceRetentionData] = []
        for row in result.all():
            resource_data = ResourceRetentionData(
                s3_paths=[], timestamp=row.occurrence_time
            )
            if row.face_s3_path:
                resource_data.s3_paths.append(S3Path(row.face_s3_path))
            if row.person_s3_path:
                resource_data.s3_paths.append(S3Path(row.person_s3_path))
            data.append(resource_data)
        return data

    @staticmethod
    async def delete_in_range_for_camera(
        session: AsyncSession,
        mac_address: str,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
    ) -> None:
        query = (
            sa.delete(FaceOccurrence)
            .where(FaceOccurrence.occurrence_time >= start_time)
            .where(FaceOccurrence.occurrence_time <= end_time)
            .where(FaceOccurrence.mac_address == mac_address)
        )
        await session.execute(query)

    @staticmethod
    async def get_face_occurrence_or_none(
        session: TenantAwareAsyncSession, face_occurrence_id: int
    ) -> face_models.FaceOccurrence | None:
        query = (
            sa.select(
                FaceOccurrence.id,
                FaceOccurrence.occurrence_time,
                FaceOccurrence.pcp_idx_in_frame,
                FaceOccurrence.face_s3_path,
                FaceOccurrence.person_s3_path,
                FaceOccurrence.face_sharpness,
                FaceOccurrence.mac_address.label("camera_mac_address"),
                NVRUniqueFace.nvr_unique_face_id.label("nvr_unique_face_id"),
                OrganizationUniqueFace.id.label("org_unique_face_id"),
            )
            .join(
                NVRUniqueFace,
                FaceOccurrence.nvr_unique_face_id == NVRUniqueFace.nvr_unique_face_id,
            )
            .join(
                OrganizationUniqueFace,
                NVRUniqueFace.org_unique_face_id == OrganizationUniqueFace.id,
            )
        )

        query = query.where(FaceOccurrence.id == face_occurrence_id)
        res = (await session.execute(query)).one_or_none()
        return face_models.FaceOccurrence.from_orm(res) if res else None
