import { MenuItem } from "@mui/material";
import { StyledSelect } from "components/styled_components/StyledSelect";
import { CameraGroup } from "coram-common-utils";

interface SelectCameraGroupFilterProps {
  groupFilter: number | undefined;
  onCameraGroupFilterChange: (groupFilter: number | undefined) => void;
  groups: CameraGroup[];
}

export function SelectCameraGroupFilter({
  groupFilter,
  onCameraGroupFilterChange,
  groups,
}: SelectCameraGroupFilterProps) {
  return (
    <StyledSelect
      value={groupFilter}
      displayEmpty
      disabled={groups.length === 0}
      onChange={(e) => onCameraGroupFilterChange(e.target.value as number)}
      sx={{ width: "100%", height: "100%" }}
    >
      <MenuItem value={undefined}>All Camera Groups</MenuItem>
      {groups.map((cameraGroup) => (
        <MenuItem key={cameraGroup.id} value={cameraGroup.id}>
          {cameraGroup.name}
        </MenuItem>
      ))}
    </StyledSelect>
  );
}
