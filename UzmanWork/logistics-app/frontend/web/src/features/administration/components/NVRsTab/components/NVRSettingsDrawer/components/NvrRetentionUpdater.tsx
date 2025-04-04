import { AdminService } from "coram-common-utils";
import { useContext, useState } from "react";
import { NotificationContext } from "contexts/notification_context";
import { MenuItem } from "@mui/material";
import { confirm } from "utils/confirm";
import { StyledSelect } from "components/styled_components/StyledSelect";
import { useIsUserDeviceManager } from "features/administration/hooks";

const retentionDaysOptions = [30, 60, 90, 120, 150, 180, 365, 450];

interface NvrRetentionUpdaterProps {
  nvr_uuid: string;
  retention_days: number;
  refetchNvrs: () => Promise<unknown>;
}

export function NvrRetentionUpdater({
  nvr_uuid,
  retention_days,
  refetchNvrs,
}: NvrRetentionUpdaterProps) {
  const isDeviceManager = useIsUserDeviceManager();

  const [retentionDays, setRetentionDays] = useState<number>(retention_days);
  const { setNotificationData } = useContext(NotificationContext);

  async function updateRetention(retention_days: number) {
    try {
      await AdminService.updateNvrRetention({
        nvr_uuid: nvr_uuid,
        retention_days: retention_days,
      });
      await refetchNvrs();
      setRetentionDays(retention_days);
      setNotificationData({
        message: "Retention days has been successfully updated!",
        severity: "success",
      });
    } catch (e) {
      await refetchNvrs();
      setNotificationData({
        message: "Failed to update retention days",
        severity: "error",
      });
    }
  }

  const retentionItems = Array.from(retentionDaysOptions).map(
    (option, index) => (
      <MenuItem key={index + 1} value={option}>
        {option}
      </MenuItem>
    )
  );

  return (
    <StyledSelect
      fullWidth={true}
      value={retentionDays}
      onChange={async (event) => {
        const isConfirmed = await confirm({
          confirmText:
            "Changing the NVR retention might delete video logs on the NVR.",
          yesText: "Yes, apply the new retention setting",
          noText: "No, keep the current retention setting",
        });

        if (!isConfirmed) {
          return;
        }
        updateRetention(event.target.value as number);
      }}
      label="Retention days"
      disabled={!isDeviceManager}
    >
      {retentionItems}
    </StyledSelect>
  );
}
