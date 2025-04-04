import sqlalchemy as sa

from backend.database import models
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession


class OrganizationAlertSubscriber(TenantProtectedTable):
    __tablename__ = "organization_alert_subscribers"
    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    alert_type = sa.Column(sa.Enum(models.SubscriberAlertType), nullable=False)
    alert_target = sa.Column(sa.String, nullable=False)
    __table_args__ = (
        (
            sa.ForeignKeyConstraint(
                ["tenant"], ["organizations.tenant"], ondelete="cascade"
            )
        ),
    )

    @staticmethod
    async def add_organization_alert_subscriber(
        session: TenantAwareAsyncSession,
        alert_type: models.SubscriberAlertType,
        alert_target: str,
    ) -> None:
        subscriber = OrganizationAlertSubscriber(
            tenant=session.tenant, alert_type=alert_type, alert_target=alert_target
        )
        session.add(subscriber)

    @staticmethod
    async def remove_organization_alert_subscriber(
        session: TenantAwareAsyncSession,
        alert_type: models.SubscriberAlertType,
        alert_target: str,
    ) -> None:
        await session.execute(
            sa.delete(OrganizationAlertSubscriber).where(
                sa.and_(
                    OrganizationAlertSubscriber.alert_type == alert_type,
                    OrganizationAlertSubscriber.alert_target == alert_target,
                )
            )
        )

    @staticmethod
    async def get_organization_alert_subscribers(
        session: TenantAwareAsyncSession,
    ) -> list[models.AlertSubscriber]:
        subscribers = (
            (await session.execute(sa.select(OrganizationAlertSubscriber)))
            .scalars()
            .all()
        )

        return [
            models.AlertSubscriber.from_orm(subscriber) for subscriber in subscribers
        ]

    @staticmethod
    async def get_organization_email_subscribers(
        session: TenantAwareAsyncSession,
    ) -> list[str]:
        query = (
            sa.select(OrganizationAlertSubscriber.alert_target)
            .where(
                sa.and_(
                    OrganizationAlertSubscriber.alert_type
                    == models.SubscriberAlertType.EMAIL
                )
            )
            .distinct()
        )
        return (await session.execute(query)).scalars().all()
