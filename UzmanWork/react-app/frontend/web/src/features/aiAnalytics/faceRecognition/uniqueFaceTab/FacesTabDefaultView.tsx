import { FeatureFlags } from "coram-common-utils";
import { useFeatureEnabled } from "utils/globals";
import { UniqueFacesTab } from "./UniqueFacesTab";
import { Typography } from "@mui/material";
import { FaceOccurrencesTab } from "./FaceOccurrencesTab";
import { useSelectedFaceFromUrl } from "../hooks";

export function FacesTabDefaultView() {
  // Check if the face recognition feature is enabled
  const isFaceRecognitionEnabled = useFeatureEnabled(FeatureFlags.FACE_ENABLED);
  const { selectedFace, setSelectedFace } = useSelectedFaceFromUrl();

  return isFaceRecognitionEnabled ? (
    selectedFace ? (
      <FaceOccurrencesTab
        selectedFace={selectedFace}
        setSelectedFace={setSelectedFace}
      />
    ) : (
      <UniqueFacesTab />
    )
  ) : (
    <Typography variant="h2" align="center">
      Person of Interest is disabled, ask your admin to enable it in the
      settings page
    </Typography>
  );
}
