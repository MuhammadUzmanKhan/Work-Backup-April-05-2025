import { useState, useCallback } from "react";
import { DateTime } from "luxon";
import { ClipFilterState, ClipMode } from "components/timeline/utils";
import {
  INITIAL_SEARCH_FILTER_STATE,
  SearchFilterState,
  useInitializeSearchFilter,
} from "utils/search_filter";
import { SearchCbParams } from "components/common/search_filter/SearchFilter";
import { isDefined } from "coram-common-utils";
import { TimeInterval } from "utils/time";
import { CLIP_FILTER_OBJECT_TYPES } from "components/timeline/TimelineClipFilters";
import { NestedSelectionData } from "components/selector/GroupSelector";

// Max days to search back from current time
const MAX_DAYS = 7;

const INITIAL_CLIP_FILTER_STATE: ClipFilterState = {
  timeInterval: {
    timeStart: DateTime.now().minus({ days: MAX_DAYS }).startOf("day"),
    timeEnd: DateTime.now().endOf("day"),
  },
  macAddresses: [],
  objectFilter: CLIP_FILTER_OBJECT_TYPES[0],
  searchQuery: "",
  mode: ClipMode.SEARCH_QUERY,
  maxVideoLengthMin: 5,
  roi: [],
};

// TODO:(@mustafa):Need separate hooks to utilize business logic and state management.
export function useDiscoverPage() {
  const [hasSubmittedSearch, setHasSubmittedSearch] = useState<boolean>(false);
  const [userQueryText, setUserQueryText] = useState<string>("");
  const [numSearchResults, setNumSearchResults] = useState<number>(0);
  const [clipFilterState, setClipFilterState] = useState<ClipFilterState>(
    INITIAL_CLIP_FILTER_STATE
  );
  const [filter, setFilter] = useState<SearchFilterState>(
    INITIAL_SEARCH_FILTER_STATE
  );
  const [searchParams, setSearchParams] = useState<SearchCbParams>();
  const [searchResultsAreLoading, setSearchResultsAreLoading] =
    useState<boolean>(true);

  const getCameraMacAddresses = useCallback(
    (cameraSelectionData: Map<number, NestedSelectionData>) => {
      const selectedCameraMacAddresses: string[] = [];
      // Iterate through the camera groups
      for (const [groupId, cameraGroup] of cameraSelectionData) {
        // If the group is selected, add all the cameras in the group
        if (cameraGroup.isGroupSelected) {
          selectedCameraMacAddresses.push(
            ...filter.allStreams
              .filter((stream) => stream.camera.camera_group_id === groupId)
              .map((stream) => stream.camera.mac_address)
          );
        } else {
          // Otherwise, add the selected cameras in the group
          for (const selectedCameraId of cameraGroup.selectedItemIds) {
            const selectedStream = filter.allStreams.find(
              (stream) => stream.camera.id === selectedCameraId
            );
            if (selectedStream) {
              selectedCameraMacAddresses.push(
                selectedStream.camera.mac_address
              );
            }
          }
        }
      }
      return selectedCameraMacAddresses;
    },
    [filter.allStreams]
  );

  const onSearchFilterChange = useCallback(async (params: SearchCbParams) => {
    setSearchParams(params);
    setClipFilterState((prevState: ClipFilterState) => ({
      ...prevState,
      timeInterval: {
        timeStart: DateTime.fromISO(params.startTime),
        timeEnd: DateTime.fromISO(params.endTime),
      },
      macAddresses: params.macAddresses,
    }));
    return true;
  }, []);

  const handleSearchQuerySubmit = useCallback(async () => {
    setHasSubmittedSearch(true);
    if (!isDefined(searchParams)) {
      setClipFilterState((prevState: ClipFilterState) => ({
        ...prevState,
        searchQuery: userQueryText,
        timeInterval: {
          timeStart: filter.timeInterval.timeStart,
          timeEnd: filter.timeInterval.timeEnd,
        },
        macAddresses: getCameraMacAddresses(filter.selectedCameras),
      }));
    } else {
      setClipFilterState((prevState: ClipFilterState) => ({
        ...prevState,
        searchQuery: userQueryText,
        timeInterval: {
          timeStart: DateTime.fromISO(searchParams.startTime),
          timeEnd: DateTime.fromISO(searchParams.endTime),
        },
        macAddresses: searchParams.macAddresses,
      }));
    }
    setUserQueryText("");
  }, [
    filter.selectedCameras,
    filter.timeInterval.timeEnd,
    filter.timeInterval.timeStart,
    getCameraMacAddresses,
    searchParams,
    userQueryText,
  ]);

  const initialTimeInterval: TimeInterval = {
    timeStart: DateTime.now().minus({ days: 3 }),
    timeEnd: DateTime.now(),
  };
  const searchFilterIsFetched = useInitializeSearchFilter(
    setFilter,
    initialTimeInterval
  );

  return {
    hasSubmittedSearch,
    userQueryText,
    numSearchResults,
    clipFilterState,
    filter,
    searchResultsAreLoading,
    setFilter,
    onSearchFilterChange,
    setSearchResultsAreLoading,
    setNumSearchResults,
    handleSearchQuerySubmit,
    setUserQueryText,
    searchFilterIsFetched,
  };
}
