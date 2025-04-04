import { FeatureFlags } from "coram-common-utils";
import { useState } from "react";
import { useFeatureEnabled } from "utils/globals";
import { FaceProfilesTab } from "./FaceProfilesTab";
import { Typography } from "@mui/material";
import { AlertOccurrencesTab } from "../AlertOccurrencesTab";

export function ProfilesTabDefaultView() {
  const [selectedFaceProfileId, setSelectedFaceProfileId] = useState<
    number | null
  >();
  // Check if the face recognition feature is enabled
  const isFaceRecognitionEnabled = useFeatureEnabled(FeatureFlags.FACE_ENABLED);

  return isFaceRecognitionEnabled ? (
    selectedFaceProfileId ? (
      <AlertOccurrencesTab
        selectedFaceProfileId={selectedFaceProfileId}
        onFaceClick={setSelectedFaceProfileId}
      />
    ) : (
      <FaceProfilesTab onFaceClick={setSelectedFaceProfileId} />
    )
  ) : (
    <Typography variant="h2" align="center">
      Person of Interest is disabled, ask your admin to enable it in the
      settings page
    </Typography>
  );
}
