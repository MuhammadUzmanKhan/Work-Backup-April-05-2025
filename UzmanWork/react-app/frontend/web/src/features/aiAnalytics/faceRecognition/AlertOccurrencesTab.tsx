import { useContext } from "react";
import { useFaceAlertProfile } from "utils/globals";
import { isDefined } from "coram-common-utils";
import { NotificationContext } from "contexts/notification_context";
import { AlertOccurrencesRenderer } from "./components";

export interface AlertOccurrencesTabProps {
  selectedFaceProfileId: number;
  onFaceClick: (faceId: number | null) => void;
}

export function AlertOccurrencesTab({
  selectedFaceProfileId,
  onFaceClick,
}: AlertOccurrencesTabProps) {
  const { setNotificationData } = useContext(NotificationContext);

  // Fetch the face profile for the selected face.
  const {
    data: faceAlertProfile,
    isFetchedAfterMount: isProfileFetched,
    refetch: refetchProfile,
  } = useFaceAlertProfile({
    profile_identifier: {
      alert_profile_id: selectedFaceProfileId,
    },
  });

  if (!isProfileFetched) return <></>;

  if (
    !isDefined(faceAlertProfile) ||
    !isDefined(faceAlertProfile.alert_profile_response)
  ) {
    setNotificationData({
      message: "Something went wrong. Please try again later!",
      severity: "error",
    });
    console.error("Face alert profile not found");
    // Set the selected face profile to null to go back to the previous tab.
    onFaceClick(null);
    return <></>;
  }

  return (
    <AlertOccurrencesRenderer
      faceAlertProfile={faceAlertProfile.alert_profile_response}
      selectedFaceProfileId={selectedFaceProfileId}
      setSelectedFaceProfileId={onFaceClick}
      refetchProfile={refetchProfile}
    />
  );
}
