import { useContext, useState } from "react";
import { Stack, type SxProps } from "@mui/material";
import { formatDateTime } from "utils/dates";
import { useOnMount } from "hooks/lifetime";

import { NestedSelectionData } from "components/selector/GroupSelector";
import { NestedSelector } from "components/selector/NestedSelector";
import { useCamerasAsNestedSelectorItems } from "hooks/selector";
import { SearchFilterContext } from "utils/search_filter";
import { SearchInput } from "components/devices/SearchInput";
import { PanelDateTimePickers } from "components/timeline/common_panel/PanelDateTimePickers";
import { INITIAL_ERROR_STATE } from "components/timeline/common_panel/PanelSubmitButton";
import { ErrorState } from "components/timeline/utils";
import { TimeInterval } from "utils/time";
import { Duration } from "luxon";
import {
  CameraGroupWithLocations,
  getTimezoneFromCamera,
} from "coram-common-utils";

const EMPTY_ITEMS = new Map();

const LOCATION_SELECTOR_STYLE = {
  minWidth: 150,
  display: "flex",
  justifyContent: "center",
  height: "2.15rem",
  paddingRight: "0.2rem",
  borderRadius: "0.25rem",
  border: "1px solid #E0E0E0",
};

export interface SearchCbParams {
  startTime: string;
  endTime: string;
  locationIds: number[];
  macAddresses: string[];
}
export interface SearchFilterProps {
  handleFilterUpdate: (params: SearchCbParams) => Promise<boolean>;
  maxDurationBetweenSearchStartAndEndTime: Duration;
  maxDurationBetweenSearchStartTimeAndNow?: Duration;
  enableSearchBox?: boolean;
  onSearchQueryTypeChange?: () => void;
  containerSx?: SxProps;
  selectorSx?: SxProps;
  datePickerContainerSx?: SxProps;
  dateFieldMinWidth?: string;
  dateFieldFlexGrow?: number;
  fetchDataOnMount?: boolean;
}

export function SearchFilter({
  handleFilterUpdate,
  maxDurationBetweenSearchStartAndEndTime,
  maxDurationBetweenSearchStartTimeAndNow = undefined,
  enableSearchBox = false,
  onSearchQueryTypeChange = undefined,
  containerSx = undefined,
  selectorSx = undefined,
  datePickerContainerSx = undefined,
  dateFieldMinWidth = undefined,
  dateFieldFlexGrow = undefined,
  fetchDataOnMount = true,
}: SearchFilterProps) {
  const { filter, setFilter } = useContext(SearchFilterContext);
  const availableCameraItems = useCamerasAsNestedSelectorItems(
    filter.allStreams
  );
  // Get the camera groups that are available for the selected locations
  const availableCameraGroups = new Map<number, CameraGroupWithLocations>(
    Array.from(filter.allCameraGroups.entries()).filter(([, grp]) =>
      grp.location_ids.some((loc) => filter.selectedLocations.has(loc))
    )
  );
  const timezone = getTimezoneFromCamera(filter.allStreams[0]);

  function getCameraMacAddresses(
    cameraSelectionData: Map<number, NestedSelectionData>
  ) {
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
            selectedCameraMacAddresses.push(selectedStream.camera.mac_address);
          }
        }
      }
    }
    return selectedCameraMacAddresses;
  }

  async function handleDateTimeChange(newTimeInterval: TimeInterval) {
    // Store the filter state for potential rollback
    const prevFilter = filter;
    // Optimistically update the date selection
    setFilter((prevState) => ({
      ...prevState,
      timeInterval: newTimeInterval,
    }));
    // TODO (yawei VAS-2727): invalid time interval selection should be blocked by
    // the date picker
    if (
      newTimeInterval.timeEnd.diff(newTimeInterval.timeStart) >
      maxDurationBetweenSearchStartAndEndTime
    ) {
      return;
    }
    // Fetch the data for the new date selection
    const fetchSuccess = await handleFilterUpdate({
      startTime: formatDateTime(newTimeInterval.timeStart),
      endTime: formatDateTime(newTimeInterval.timeEnd),
      locationIds: Array.from(filter.selectedLocations.keys()),
      macAddresses: getCameraMacAddresses(filter.selectedCameras),
    });
    if (!fetchSuccess) {
      // If the fetch fails, revert to the previous filter state
      setFilter(prevFilter);
    }
  }

  async function handleLocationSelectionChange(
    locationSelectionData: Map<number, NestedSelectionData>
  ) {
    // Store the filter state for potential rollback
    const prevFilter = filter;
    const selectedLocationIds = Array.from(locationSelectionData.keys());

    // Get the camera groups that are available for the selected locations
    const availableCameraGroupIds = Array.from(filter.allCameraGroups.values())
      .filter((group) =>
        group.location_ids.some((loc) => selectedLocationIds.includes(loc))
      )
      .map((group) => group.id);

    // Update the camera selection to only include the available camera groups
    const cameraSelectionData = new Map();
    [...filter.selectedCameras.entries()].forEach(
      ([groupId, selectionData]) => {
        // If the group is not in the available camera groups, deselect it
        if (availableCameraGroupIds.includes(groupId)) {
          selectionData = {
            isGroupSelected: true,
            selectedItemIds: [],
          };
        } else {
          selectionData = {
            isGroupSelected: false,
            selectedItemIds: selectionData.selectedItemIds.filter((id) =>
              availableCameraGroupIds.includes(id)
            ),
          };
        }
        cameraSelectionData.set(groupId, selectionData);
      }
    );

    // Optimistically update the location selection
    setFilter((prevState) => ({
      ...prevState,
      selectedLocations: locationSelectionData,
      selectedCameras: cameraSelectionData,
    }));
    // Fetch the data for the new location selection
    const fetchSuccess = await handleFilterUpdate({
      startTime: formatDateTime(filter.timeInterval.timeStart),
      endTime: formatDateTime(filter.timeInterval.timeEnd),
      locationIds: Array.from(locationSelectionData.keys()),
      macAddresses: getCameraMacAddresses(cameraSelectionData),
    });
    if (!fetchSuccess) {
      // If the fetch fails, revert to the previous filter state
      setFilter(prevFilter);
    }
  }

  async function handleCameraSelectionChange(
    camerasData: Map<number, NestedSelectionData>
  ) {
    // Store the filter state for potential rollback
    const prevFilter = filter;
    // Optimistically update the camera selection
    setFilter((prevState) => ({
      ...prevState,
      selectedCameras: camerasData,
    }));
    // Fetch the data for the new camera selection
    const fetchSuccess = await handleFilterUpdate({
      startTime: formatDateTime(filter.timeInterval.timeStart),
      endTime: formatDateTime(filter.timeInterval.timeEnd),
      locationIds: Array.from(filter.selectedLocations.keys()),
      macAddresses: getCameraMacAddresses(camerasData),
    });
    if (!fetchSuccess) {
      // If the fetch fails, revert to the previous filter state
      setFilter(prevFilter);
    }
  }
  const [timePickerErrors, setTimePickerErrors] =
    useState<ErrorState>(INITIAL_ERROR_STATE);

  // Fetch the data for the last day when the component mounts.
  useOnMount(async () => {
    // TODO: The fetchDataOnMount is specific to mobile behavior.
    // this component should be split between desktop and mobile

    // Check if data fetching prevented on mount
    if (!fetchDataOnMount) return;
    await handleFilterUpdate({
      startTime: formatDateTime(filter.timeInterval.timeStart),
      endTime: formatDateTime(filter.timeInterval.timeEnd),
      locationIds: Array.from(filter.selectedLocations.keys()),
      macAddresses: getCameraMacAddresses(filter.selectedCameras),
    });
  });

  return (
    <Stack direction="row" alignItems="end" gap={2} sx={containerSx}>
      <PanelDateTimePickers
        timezone={timezone}
        startTime={filter.timeInterval.timeStart}
        endTime={filter.timeInterval.timeEnd}
        setStartTime={(newStartTime) => {
          handleDateTimeChange({
            timeStart: newStartTime,
            timeEnd: filter.timeInterval.timeEnd,
          });
        }}
        setEndTime={(newEndTime) => {
          handleDateTimeChange({
            timeStart: filter.timeInterval.timeStart,
            timeEnd: newEndTime,
          });
        }}
        errors={timePickerErrors}
        setErrors={setTimePickerErrors}
        maxDurationBetweenStartAndEndTime={
          maxDurationBetweenSearchStartAndEndTime
        }
        maxDurationBetweenStartAndEndTimeText="search time interval"
        maxDurationBetweenStartTimeAndNow={
          maxDurationBetweenSearchStartTimeAndNow
        }
        direction="row"
        dateFieldMinWidth={dateFieldMinWidth}
        containerSx={datePickerContainerSx}
        flexGrow={dateFieldFlexGrow}
      />
      <NestedSelector
        groups={filter.allLocations}
        items={EMPTY_ITEMS}
        selectionData={filter.selectedLocations}
        label={`(${filter.selectedLocations.size}) Locations`}
        onChange={handleLocationSelectionChange}
        onClose={() => null}
        onClick={() => null}
        selectorProps={{
          fontSize: "12px",
        }}
        disabled={false}
        sx={{ ...LOCATION_SELECTOR_STYLE, ...selectorSx }}
      />
      <NestedSelector
        groups={availableCameraGroups}
        items={availableCameraItems}
        selectionData={filter.selectedCameras}
        label={`(${
          getCameraMacAddresses(filter.selectedCameras).length
        }) Cameras`}
        onChange={handleCameraSelectionChange}
        onClose={() => null}
        onClick={() => null}
        selectorProps={{
          fontSize: "12px",
        }}
        disabled={false}
        sx={{ ...LOCATION_SELECTOR_STYLE, ...selectorSx }}
      />
      {enableSearchBox && (
        <SearchInput
          placeHolder="Search"
          value={filter.searchQuery}
          onChange={(value) => {
            setFilter({
              ...filter,
              searchQuery: value,
            });
            onSearchQueryTypeChange?.();
          }}
          sx={{ marginLeft: "auto" }}
        />
      )}
    </Stack>
  );
}
