import { Stack } from "@mui/material";
import { useContext, useState } from "react";
import { FaceAlertService, FaceAlertProfile } from "coram-common-utils";
import { NotificationContext } from "contexts/notification_context";
import { FaceProfileEditor } from "./FaceProfileEditor";
import { LoadingButton } from "@mui/lab";
import { useRegisterPersonOfInterest } from "./hooks";

export interface FaceProfileUpdaterProps {
  faceProfile: FaceAlertProfile;
  refetchProfile: () => void;
}

export interface Profile {
  name: string;
  editMode: boolean;
}

export function FaceProfileUpdater({
  faceProfile,
  refetchProfile,
}: FaceProfileUpdaterProps) {
  const [localProfile, setLocalProfile] = useState<Profile>({
    name: faceProfile.description || "Untitled",
    editMode: false,
  });
  const { setNotificationData } = useContext(NotificationContext);

  const { mutateAsync: addPersonOfInterest, isLoading } =
    useRegisterPersonOfInterest({ onSettled: refetchProfile });
  async function onProfileUpdate() {
    try {
      await FaceAlertService.updateProfileDescription(faceProfile.id, {
        description: localProfile.name,
      });
    } catch (e) {
      setLocalProfile({
        name: faceProfile.description || "Untitled",
        editMode: false,
      });
      setNotificationData({
        message: "Something went wrong. Please try again later!",
        severity: "error",
      });
      console.error(e);
    }
    refetchProfile();
  }

  return (
    <Stack
      direction="column"
      spacing={1.5}
      paddingY={1.5}
      justifyContent="center"
    >
      <FaceProfileEditor
        name={localProfile.name}
        editMode={localProfile.editMode}
        onEditClick={() =>
          setLocalProfile((prevState) => ({ ...prevState, editMode: true }))
        }
        onCancelEdit={() =>
          setLocalProfile({
            name: faceProfile.description || "Untitled",
            editMode: false,
          })
        }
        onSaveEdit={() => {
          onProfileUpdate();
          setLocalProfile((prevState) => ({
            ...prevState,
            editMode: false,
          }));
        }}
        onInputChange={(event) => {
          setLocalProfile((prevState) => ({
            ...prevState,
            name: event.target.value,
          }));
        }}
      />
      <LoadingButton
        loading={isLoading}
        disabled={faceProfile.is_person_of_interest}
        onClick={async () =>
          await addPersonOfInterest({ faceProfileId: faceProfile.id })
        }
        color={"secondary"}
        variant="contained"
      >
        {faceProfile.is_person_of_interest
          ? "Added to Person of Interest"
          : "Add to Person of Interest"}
      </LoadingButton>
    </Stack>
  );
}
