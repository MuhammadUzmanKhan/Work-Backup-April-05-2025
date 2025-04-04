import {
  CameraGroupWithLocations,
  Location,
  filterCameraGroupsByLocation,
  isDefined,
} from "coram-common-utils";
import { useEffect, useState } from "react";
import { WallParams } from "./types";
import { View } from "react-native";
import { ScrollableSelect } from "../../components/ScrollableSelect";
import { SelectItem } from "@gluestack-ui/themed";

const ALL_GROUPS_VALUE = -1;

interface WallFiltersProps {
  locations: Map<number, Location>;
  groups: Map<number, CameraGroupWithLocations>;
  wallParams: WallParams;
  setWallParams: (wallParams: WallParams) => void;
  onChange: () => void;
}

export function WallFilters({
  locations,
  groups,
  wallParams,
  setWallParams,
  onChange,
}: WallFiltersProps) {
  // Update wall params when locations or groups change.
  // This happens when we fetch the data.
  useEffect(() => {
    // If we already have a location selected, don't update
    if (isDefined(wallParams.location)) {
      return;
    }
    // Get the first location available
    const location = locations.values().next().value as Location | undefined;
    // If we don't have a location, don't update
    if (!isDefined(location)) {
      return;
    }

    setWallParams({
      ...wallParams,
      location: location,
      cameraGroup: undefined,
    });
  }, [locations, groups, setWallParams, wallParams]);

  const [isOpenLocations, setIsOpenLocations] = useState(false);
  const [isOpenGroups, setIsOpenGroups] = useState(false);

  return (
    <View
      style={{
        width: "100%",
        flexDirection: "row",
        paddingHorizontal: 16,
        gap: 4,
      }}
    >
      <ScrollableSelect
        isOpened={isOpenLocations}
        setIsOpened={setIsOpenLocations}
        selectedValue={wallParams.location?.name ?? ""}
        sx={{ width: "50%" }}
      >
        {Array.from(locations.values())
          .sort((locA, locB) => locA.name.localeCompare(locB.name))
          .map((loc) => (
            <SelectItem
              key={loc.id}
              label={loc.name}
              value={String(loc.id)}
              onPress={() => {
                setWallParams({
                  ...wallParams,
                  location: loc,
                  cameraGroup: undefined,
                });
                setIsOpenLocations(false);
                onChange();
              }}
            />
          ))}
      </ScrollableSelect>

      <ScrollableSelect
        isOpened={isOpenGroups}
        setIsOpened={setIsOpenGroups}
        selectedValue={wallParams.cameraGroup?.name ?? "All groups"}
        sx={{ width: "50%" }}
      >
        {filterCameraGroupsByLocation(wallParams.location?.id, [
          ...groups.values(),
        ])
          .sort((groupA, groupB) => groupA.name.localeCompare(groupB.name))
          .map((group) => (
            <SelectItem
              key={group.id}
              label={group.name}
              value={String(group.id)}
              onPress={() => {
                setWallParams({
                  ...wallParams,
                  cameraGroup: group,
                });
                setIsOpenGroups(false);
                onChange();
              }}
            />
          ))}
        <SelectItem
          key={ALL_GROUPS_VALUE}
          label="All groups"
          value={String(ALL_GROUPS_VALUE)}
          onPress={() => {
            setWallParams({
              ...wallParams,
              cameraGroup: undefined,
            });
            setIsOpenGroups(false);
            onChange();
          }}
        />
      </ScrollableSelect>
    </View>
  );
}
