import { LoadingButton } from "@mui/lab";
import { useUnassignNvr } from "../hooks";
import { useContext } from "react";
import { NotificationContext } from "contexts/notification_context";
import { confirm } from "utils/confirm";
import { useIsUserDeviceManager } from "features/administration/hooks";

interface NvrRemoveButtonProps {
  nvrUuid: string;
  refetchNvrs: () => Promise<unknown>;
}

export function NvrRemoveButton({
  nvrUuid,
  refetchNvrs,
}: NvrRemoveButtonProps) {
  const isDeviceManager = useIsUserDeviceManager();

  const { setNotificationData } = useContext(NotificationContext);

  const { mutateAsync: unassignNvr, isLoading } = useUnassignNvr({
    onSuccess: () => {
      setNotificationData({
        message: "NVR unassigned",
        severity: "success",
      });
    },
    onError: (err) => {
      console.error(err);
      setNotificationData({
        message: "Failed to unassign NVR",
        severity: "error",
      });
    },
  });

  return (
    <LoadingButton
      variant="contained"
      color="error"
      loading={isLoading}
      onClick={async () => {
        const isConfirmed = await confirm({
          confirmText:
            "This action will remove the NVR from the organization. Are you sure you want to proceed?",
          yesText: "Yes, remove the NVR",
          noText: "No, keep the NVR",
        });
        if (!isConfirmed) {
          return;
        }
        await unassignNvr(nvrUuid);
        await refetchNvrs();
      }}
      disabled={!isDeviceManager}
    >
      Unassign NVR
    </LoadingButton>
  );
}
