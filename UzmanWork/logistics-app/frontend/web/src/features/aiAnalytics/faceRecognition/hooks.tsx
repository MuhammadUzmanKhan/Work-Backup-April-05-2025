import { FaceAlertProfileResponse, FaceAlertService } from "coram-common-utils";
import { useQuery } from "react-query";
import { FACE_ALERT_PROFILE_KEY } from "./constants";
import { useRecoilState } from "recoil";
import { selectedFaceState } from "./utils";
import { useSearchParams } from "utils/search_params";
import { useEffect } from "react";

const EMPTY_ALERT_PROFILES: FaceAlertProfileResponse[] = [];

export function useFaceAlertProfiles() {
  const queryResult = useQuery(
    [FACE_ALERT_PROFILE_KEY],
    async () => {
      return await FaceAlertService.getAlertProfiles();
    },
    {
      refetchOnWindowFocus: false,
    }
  );
  return {
    ...queryResult,
    data: queryResult.data ?? EMPTY_ALERT_PROFILES,
  };
}

export function useSelectedFaceFromUrl() {
  const [selectedFace, setSelectedFace] = useRecoilState(selectedFaceState);
  const { searchParams } = useSearchParams();
  const faceIdFromUrl = searchParams.get("face_id");

  useEffect(() => {
    if (
      faceIdFromUrl &&
      selectedFace &&
      Number(faceIdFromUrl) === selectedFace.org_unique_face_id
    ) {
      // If the face ID from the URL matches the selected face, do nothing
      return;
    } else {
      // Otherwise, clear the selected face
      setSelectedFace(null);
    }
  }, [faceIdFromUrl, selectedFace, setSelectedFace]);

  return { selectedFace, setSelectedFace };
}
