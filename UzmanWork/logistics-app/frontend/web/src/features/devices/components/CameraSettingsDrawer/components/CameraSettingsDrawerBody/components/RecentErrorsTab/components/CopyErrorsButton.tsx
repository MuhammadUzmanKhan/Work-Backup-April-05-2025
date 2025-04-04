import { IconButton, Tooltip } from "@mui/material";
import { CopyIcon } from "icons";
import { CameraPipelineAlertCreate } from "features/devices/types";
import { formatDateTime, getUserFacingDescription } from "../utils";
import { useContext } from "react";
import { NotificationContext } from "contexts/notification_context";
import { unparse } from "papaparse";

interface CopyErrorsButtonProps {
  alerts: CameraPipelineAlertCreate[];
  camerasTimezones: Map<string, string | undefined>;
}

export function CopyErrorsButton({
  alerts,
  camerasTimezones,
}: CopyErrorsButtonProps) {
  const { setNotificationData } = useContext(NotificationContext);

  async function handleCopyToClipboard() {
    const data = alerts.map(
      ({ time_generated, camera_mac_address, alert_type }) => ({
        Date: formatDateTime(
          time_generated,
          camerasTimezones.get(camera_mac_address)
        ),
        Error: alert_type,
        Description: getUserFacingDescription(alert_type),
      })
    );

    const csvContent = unparse(data, {
      delimiter: ",",
      header: true,
    });

    await navigator.clipboard.writeText(csvContent);
    setNotificationData({
      message: "Copied to clipboard",
      severity: "success",
    });
  }

  return (
    <Tooltip title="Copy to clipboard">
      <IconButton onClick={handleCopyToClipboard}>
        <CopyIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
