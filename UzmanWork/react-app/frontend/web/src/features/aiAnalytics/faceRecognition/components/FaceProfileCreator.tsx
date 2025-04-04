import { Stack } from "@mui/material";
import { useState } from "react";
import { UniqueFaceResponse } from "coram-common-utils";
import { Profile } from "./FaceProfileUpdater";
import { FaceProfileEditor } from "./FaceProfileEditor";
import { useRegisterAlertProfile } from "./hooks";
import { LoadingButton } from "@mui/lab";

export interface FaceProfileCreatorProps {
  selectedFace: UniqueFaceResponse;
  refetchProfile: () => void;
}

const initialProfileState = {
  name: "Untitled",
  editMode: false,
};

export function FaceProfileCreator({
  selectedFace,
  refetchProfile,
}: FaceProfileCreatorProps) {
  const [localProfile, setLocalProfile] =
    useState<Profile>(initialProfileState);

  const { mutateAsync: registerAlertProfile, isLoading } =
    useRegisterAlertProfile({
      onError: () => {
        setLocalProfile(initialProfileState);
      },
      onSettled: refetchProfile,
    });

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
          setLocalProfile({ name: "Untitled", editMode: false })
        }
        onSaveEdit={() =>
          setLocalProfile((prevState) => ({
            ...prevState,
            editMode: false,
          }))
        }
        onInputChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setLocalProfile((prevState) => ({
            ...prevState,
            name: event.target.value,
          }));
        }}
      />
      <LoadingButton
        loading={isLoading}
        onClick={() => {
          registerAlertProfile({
            orgUniqueFaceId: selectedFace.org_unique_face_id,
            description: localProfile.name,
            is_person_of_interest: false,
          });
        }}
        color="inherit"
        variant="outlined"
        sx={{ paddingX: "1.5rem", paddingY: "0.3rem" }}
      >
        Add to Profile
      </LoadingButton>
      <LoadingButton
        loading={isLoading}
        onClick={() => {
          registerAlertProfile({
            orgUniqueFaceId: selectedFace.org_unique_face_id,
            description: localProfile.name,
            is_person_of_interest: true,
          });
        }}
        color="secondary"
        variant="contained"
        sx={{ paddingX: "1.5rem", paddingY: "0.7rem" }}
      >
        Add to Person of Interest
      </LoadingButton>
    </Stack>
  );
}
