import {
  createContext,
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { DateTime } from "luxon";
import { NestedSelectionData } from "components/selector/GroupSelector";
import {
  CameraGroupWithLocations,
  CameraResponse,
  Location,
  useCamerasList,
  getTimezoneFromCamera,
  useLocations,
  useCameraGroupsWithLocation,
} from "coram-common-utils";
import { cameraSelectionFromRestrictions } from "components/analytics/utils";
import { locationSelectionFromRestrictions } from "components/settings/utils";
import { TimeInterval } from "./time";

export interface SearchFilterState {
  timeInterval: TimeInterval;
  selectedLocations: Map<number, NestedSelectionData>;
  selectedCameras: Map<number, NestedSelectionData>;
  allLocations: Map<number, Location>;
  allCameraGroups: Map<number, CameraGroupWithLocations>;
  allStreams: CameraResponse[];
  searchQuery: string;
}

export const INITIAL_SEARCH_FILTER_STATE: SearchFilterState = {
  timeInterval: {
    timeStart: DateTime.now().minus({ day: 1 }),
    timeEnd: DateTime.now(),
  },
  selectedLocations: new Map<number, NestedSelectionData>(),
  selectedCameras: new Map<number, NestedSelectionData>(),
  allLocations: new Map<number, Location>(),
  allCameraGroups: new Map<number, CameraGroupWithLocations>(),
  allStreams: [],
  searchQuery: "",
};

export interface SearchFilterContextType {
  filter: SearchFilterState;
  setFilter: Dispatch<SetStateAction<SearchFilterState>>;
}

export const SearchFilterContext = createContext<SearchFilterContextType>({
  filter: INITIAL_SEARCH_FILTER_STATE,
  setFilter: () => null,
});

export function useInitializeSearchFilter(
  setFilter: Dispatch<SetStateAction<SearchFilterState>>,
  timeInterval: TimeInterval = {
    timeStart: DateTime.now().minus({ day: 1 }),
    timeEnd: DateTime.now(),
  }
) {
  // Ref to store the timeInterval without triggering re-renders
  const timeIntervalRef = useRef(timeInterval);
  // Fetch the available locations, camera groups, and cameras
  const { data: availableLocations, isFetchedAfterMount: isLocationsFetched } =
    useLocations(false);
  const {
    data: availableCameraGroups,
    isFetchedAfterMount: isCameraGroupFetched,
  } = useCameraGroupsWithLocation(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { data: availableStreams, isFetchedAfterMount: isStreamsFetched } =
    useCamerasList({ refetchOnWindowFocus: false });
  useEffect(() => {
    // Select all locations by default in the location selector
    const FULL_ACCESS = { full_access: true };
    const { timeStart, timeEnd } = timeIntervalRef.current;
    if (isLocationsFetched && isCameraGroupFetched && isStreamsFetched) {
      const initialLocationSelections = locationSelectionFromRestrictions(
        availableLocations,
        FULL_ACCESS
      );
      const initialCameraSelections = cameraSelectionFromRestrictions(
        availableCameraGroups,
        FULL_ACCESS
      );
      const timezone = getTimezoneFromCamera(availableStreams[0]);
      const updatedInitialSearchFilter: SearchFilterState = {
        ...INITIAL_SEARCH_FILTER_STATE,
        timeInterval: {
          timeStart: timeStart.setZone(timezone),
          timeEnd: timeEnd.setZone(timezone),
        },
        selectedLocations: initialLocationSelections,
        selectedCameras: initialCameraSelections,
        allLocations: availableLocations,
        allCameraGroups: availableCameraGroups,
        allStreams: availableStreams,
      };
      // Set the new SearchFilter object to the state
      setFilter(updatedInitialSearchFilter);
      setIsInitialized(true);
    }
  }, [
    availableCameraGroups,
    availableLocations,
    availableStreams,
    isCameraGroupFetched,
    isLocationsFetched,
    isStreamsFetched,
    setFilter,
  ]);
  return isInitialized;
}

export function matchAtLeastOne(
  search: string,
  fields: (string | undefined)[]
) {
  return fields.some((field) => {
    if (!field) return false;
    return field.toLowerCase().includes(search);
  });
}
