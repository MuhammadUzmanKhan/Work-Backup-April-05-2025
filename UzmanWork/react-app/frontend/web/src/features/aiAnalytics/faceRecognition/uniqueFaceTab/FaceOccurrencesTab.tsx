import { FaceService, UniqueFaceResponse, isDefined } from "coram-common-utils";
import { SearchCbParams } from "components/common/search_filter/SearchFilter";
import { useFaceAlertProfile } from "utils/globals";
import { FaceProfileUpdater, FaceProfileCreator } from "../components";
import { FaceOccurrencesRenderer } from "../components/FaceOccurrencesRenderer";

export interface FaceOccurrencesTabProps {
  selectedFace: UniqueFaceResponse;
  setSelectedFace: (face: UniqueFaceResponse | null) => void;
}

export function FaceOccurrencesTab({
  selectedFace,
  setSelectedFace,
}: FaceOccurrencesTabProps) {
  // Fetch the face profile for the selected face.
  const {
    data: faceAlertProfile,
    isFetchedAfterMount: isProfileFetched,
    refetch: refetchProfile,
  } = useFaceAlertProfile({
    profile_identifier: {
      org_unique_face_id: selectedFace.org_unique_face_id,
    },
  });
  if (!isProfileFetched) return <></>;

  return (
    <FaceOccurrencesRenderer
      getFaceOccurrences={(params: SearchCbParams) =>
        FaceService.faceOccurrences({
          start_time: params.startTime,
          end_time: params.endTime,
          location_ids: params.locationIds,
          org_unique_face_id: selectedFace.org_unique_face_id,
          mac_addresses: params.macAddresses,
        })
      }
      selectedFaceS3SignedUrl={selectedFace.s3_signed_url}
      selectedFaceManageElement={
        isDefined(faceAlertProfile) &&
        isDefined(faceAlertProfile.alert_profile_response) ? (
          <FaceProfileUpdater
            faceProfile={faceAlertProfile.alert_profile_response.alert_profile}
            refetchProfile={refetchProfile}
          />
        ) : (
          <FaceProfileCreator
            selectedFace={selectedFace}
            refetchProfile={refetchProfile}
          />
        )
      }
      onCloseClick={() => {
        setSelectedFace(null);
      }}
    />
  );
}
