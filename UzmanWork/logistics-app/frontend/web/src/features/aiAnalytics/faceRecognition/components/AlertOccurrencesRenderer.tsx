import { FaceAlertService, FaceAlertProfileResponse } from "coram-common-utils";
import { SearchCbParams } from "components/common/search_filter/SearchFilter";
import { FaceOccurrencesRenderer } from "./FaceOccurrencesRenderer";
import { FaceProfileUpdater } from "./FaceProfileUpdater";

export interface AlertOccurrencesRendererProps {
  faceAlertProfile: FaceAlertProfileResponse;
  selectedFaceProfileId: number;
  setSelectedFaceProfileId: (faceId: number | null) => void;
  refetchProfile: () => void;
}

export function AlertOccurrencesRenderer({
  faceAlertProfile,
  selectedFaceProfileId,
  setSelectedFaceProfileId,
  refetchProfile,
}: AlertOccurrencesRendererProps) {
  return (
    <FaceOccurrencesRenderer
      getFaceOccurrences={(params: SearchCbParams) =>
        FaceAlertService.getAlertOccurrences(selectedFaceProfileId, {
          start_time: params.startTime,
          end_time: params.endTime,
          mac_addresses: params.macAddresses,
          location_ids: params.locationIds,
        })
      }
      selectedFaceS3SignedUrl={faceAlertProfile.s3_signed_url}
      selectedFaceManageElement={
        <FaceProfileUpdater
          faceProfile={faceAlertProfile.alert_profile}
          refetchProfile={refetchProfile}
        />
      }
      onCloseClick={() => {
        setSelectedFaceProfileId(null);
      }}
    />
  );
}
