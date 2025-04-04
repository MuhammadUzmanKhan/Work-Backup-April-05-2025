import { MenuItem } from "@mui/material";
import { StyledSelect } from "components/styled_components/StyledSelect";
import { useMemo } from "react";
import { CameraGroupWithLocations, Location } from "coram-common-utils";

interface SelectCameraGroupFilterProps {
  groupFilter: number[];
  onCameraGroupFilterChange: (groupFilter: number[]) => void;
  groups: CameraGroupWithLocations[];
  location: Location | undefined;
}

export function SelectCameraGroupFilter({
  groupFilter,
  onCameraGroupFilterChange,
  groups,
  location,
}: SelectCameraGroupFilterProps) {
  const groupsFilteredByLocation = useMemo(() => {
    if (!location) {
      return [];
    }

    return [...groups.values()].filter((group) =>
      group.location_ids.includes(location.id)
    );
  }, [groups, location]);

  return (
    <StyledSelect
      value={groupFilter}
      displayEmpty
      multiple={true}
      onChange={(e) => onCameraGroupFilterChange(e.target.value as number[])}
      renderValue={(selected) => {
        const selectedArray = selected as number[];
        if (selectedArray.length === 0) {
          return "Select Group";
        }

        if (groupsFilteredByLocation.length === 0) {
          return "No Groups in this Location";
        }

        return groupsFilteredByLocation
          .filter((group) => selectedArray.includes(group.id))
          .map((group) => group.name)
          .join(", ");
      }}
      sx={{
        width: "50%",
      }}
    >
      {groupsFilteredByLocation.map((cameraGroup) => (
        <MenuItem key={cameraGroup.id} value={cameraGroup.id}>
          {cameraGroup.name}
        </MenuItem>
      ))}
    </StyledSelect>
  );
}
