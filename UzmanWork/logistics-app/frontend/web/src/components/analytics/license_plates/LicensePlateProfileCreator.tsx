import { Button } from "@mui/material";
import { LicensePlateAlertService } from "coram-common-utils";
import { NotificationContext } from "contexts/notification_context";
import { useContext } from "react";

interface LicensePlateProfileCreatorProps {
  licensePlateNumber: string;
  refetchProfile: () => void;
}

export function LicensePlateProfileCreator({
  licensePlateNumber,
  refetchProfile,
}: LicensePlateProfileCreatorProps) {
  const { setNotificationData } = useContext(NotificationContext);
  async function addProfile() {
    try {
      await LicensePlateAlertService.addAlertProfile({
        license_plate_number: licensePlateNumber,
      });
    } catch (e) {
      setNotificationData({
        message: "Failed to add license plate to profile",
        severity: "error",
      });
      console.error(e);
    }
    refetchProfile();
  }
  return (
    <Button
      onClick={() => {
        addProfile();
      }}
      color="secondary"
      variant="contained"
      sx={{ paddingX: "1.5rem", paddingY: "0.4rem" }}
    >
      Add to License Plates of Interest
    </Button>
  );
}
