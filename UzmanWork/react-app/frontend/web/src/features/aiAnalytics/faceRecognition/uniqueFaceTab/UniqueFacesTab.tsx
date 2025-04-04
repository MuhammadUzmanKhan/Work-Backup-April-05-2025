import { Box, CircularProgress, Stack } from "@mui/material";
import {
  CancelablePromise,
  FaceService,
  UniqueFaceResponse,
  isDefined,
} from "coram-common-utils";
import {
  SearchCbParams,
  SearchFilter,
} from "components/common/search_filter/SearchFilter";
import { useContext, useRef, useState } from "react";
import { NotificationContext } from "contexts/notification_context";
import { Duration } from "luxon";
import { handleSearchChange } from "components/common/search_filter/utils";
import { FaceGrid } from "../components/FaceGrid";
import { Face } from "../types/faces";
import { useSetRecoilState } from "recoil";
import { selectedFaceState } from "../utils";
import { useSearchParams } from "utils/search_params";

export interface UniqueFaceTabProps {
  setSelectedFace: (face: UniqueFaceResponse | null) => void;
}

export function UniqueFacesTab() {
  const [uniqueFaces, setUniqueFaces] =
    useState<Array<UniqueFaceResponse> | null>(null);
  // Update search param to retain selectedFace state when navigating
  const { setNotificationData } = useContext(NotificationContext);
  const [loading, setLoading] = useState<boolean>(false);
  const setSelectedFace = useSetRecoilState(selectedFaceState);
  const { setSearchParams } = useSearchParams();
  // Store the request for the unique faces so that we can cancel it if the
  // user changes the filter before the request completes.
  const uniqueFacesRequestRef = useRef<CancelablePromise<
    Array<UniqueFaceResponse>
  > | null>(null);

  async function fetchUniqueFaces(params: SearchCbParams) {
    if (uniqueFacesRequestRef.current) {
      // Cancel any previous requests
      uniqueFacesRequestRef.current.cancel();
    }
    const uniqueFacesRequest = FaceService.uniqueFaces({
      start_time: params.startTime,
      end_time: params.endTime,
      location_ids: params.locationIds,
      mac_addresses: params.macAddresses,
    });
    uniqueFacesRequestRef.current = uniqueFacesRequest;
    setUniqueFaces(await uniqueFacesRequest);
  }

  return (
    <Stack px={1} gap={2}>
      <SearchFilter
        handleFilterUpdate={async (params: SearchCbParams) => {
          return await handleSearchChange(
            params,
            fetchUniqueFaces,
            setLoading,
            setNotificationData
          );
        }}
        maxDurationBetweenSearchStartAndEndTime={Duration.fromObject({
          days: 20,
        })}
      />
      {isDefined(uniqueFaces) && !loading ? (
        <FaceGrid
          faces={uniqueFaces.map((face) => ({
            id: face.org_unique_face_id,
            s3_signed_url: face.s3_signed_url,
          }))}
          onClick={(face: Face) => {
            const selectedFace = uniqueFaces.find(
              (f) => f.org_unique_face_id === face.id
            );
            if (!selectedFace) {
              console.error("Could not find selected face");
              return;
            }
            setSelectedFace(selectedFace);
            setSearchParams({ face_id: `${selectedFace.org_unique_face_id}` });
          }}
          noFacesMessage="No unique faces found"
        />
      ) : (
        <Box pt={15} justifyContent="center" alignItems="center" display="flex">
          <CircularProgress size={45} color="secondary" />
        </Box>
      )}
    </Stack>
  );
}
