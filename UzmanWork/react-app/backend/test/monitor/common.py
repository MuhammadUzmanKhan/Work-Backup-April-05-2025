from typing import Any

from backend.monitor.alert import AlertNVR


class AlertMatcher(AlertNVR):
    def __init__(self, alert: AlertNVR):
        super().__init__(
            alert_type=alert.alert_type,
            alert_severity=alert.alert_severity,
            nvr_uuid=alert.nvr_uuid,
            org_name=alert.org_name,
            timestamp=alert.timestamp,
            detailed_info=alert.detailed_info,
        )

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, AlertNVR):
            return NotImplemented
        return self.nvr_uuid == other.nvr_uuid and self.alert_type == other.alert_type


class EncodedAlertMatcher:
    def __init__(
        self,
        alert: dict[str, Any],
        required_fields: list[str] = [
            "nvr_uuid",
            "org_name",
            "alert_type",
            "detailed_info",
        ],
    ) -> None:
        self.alert = alert
        self.required_fields = required_fields

    def __eq__(self, other_alert: object) -> bool:
        if not isinstance(other_alert, dict):
            return NotImplemented

        if not set(self.required_fields).issubset(set(other_alert)):
            return NotImplemented

        return all(
            self.alert[field] == other_alert[field] for field in self.required_fields
        )
