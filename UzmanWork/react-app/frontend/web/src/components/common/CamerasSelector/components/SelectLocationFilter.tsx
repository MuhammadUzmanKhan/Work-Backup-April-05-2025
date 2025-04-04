import { MenuItem } from "@mui/material";
import { StyledSelect } from "components/styled_components/StyledSelect";
import { Location } from "coram-common-utils";

interface SelectLocationFilterProps {
  locationFilter: number | undefined;
  onLocationFilterChange: (locationFilter: number | undefined) => void;
  locations: Location[];
}

export function SelectLocationFilter({
  locationFilter,
  onLocationFilterChange,
  locations,
}: SelectLocationFilterProps) {
  return (
    <StyledSelect
      value={locationFilter}
      displayEmpty
      disabled={locations.length === 0}
      onChange={(e) => onLocationFilterChange(e.target.value as number)}
      sx={{ width: "100%", height: "100%" }}
    >
      <MenuItem value={undefined}>All Locations</MenuItem>
      {locations.map((location) => (
        <MenuItem key={location.id} value={location.id}>
          {location.name}
        </MenuItem>
      ))}
    </StyledSelect>
  );
}
