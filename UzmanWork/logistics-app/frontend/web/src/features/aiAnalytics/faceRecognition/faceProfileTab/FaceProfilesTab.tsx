import { Box, CircularProgress } from "@mui/material";
import { isDefined } from "coram-common-utils";
import { FaceGrid } from "../components";
import { Face } from "../types/faces";
import { useFaceAlertProfiles } from "../hooks";

interface FaceProfilesTabProps {
  onFaceClick: (faceId: number | null) => void;
}

export function FaceProfilesTab({ onFaceClick }: FaceProfilesTabProps) {
  const { data: faceAlertProfiles, isLoading: isLoadingProfiles } =
    useFaceAlertProfiles();

  return (
    <Box px={1}>
      {isDefined(faceAlertProfiles) && !isLoadingProfiles ? (
        <FaceGrid
          faces={faceAlertProfiles.map((face) => ({
            id: face.alert_profile.id,
            description: face.alert_profile.description,
            s3_signed_url: face.s3_signed_url,
          }))}
          onClick={(face: Face) => {
            onFaceClick(Number(face.id));
          }}
          noFacesMessage="No face profiles found"
        />
      ) : (
        <Box pt={15} justifyContent="center" alignItems="center" display="flex">
          <CircularProgress size={45} color="secondary" />
        </Box>
      )}
    </Box>
  );
}
