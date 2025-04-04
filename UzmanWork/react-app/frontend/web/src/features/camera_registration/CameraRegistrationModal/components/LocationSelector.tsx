import { MenuItem } from "@mui/material";
import { Location, isDefined } from "coram-common-utils";
import { StyledSelect } from "components/styled_components/StyledSelect";

interface LocationSelectorMobileProps {
  locations: Map<number, Location>;
  selectedLocation?: Location;
  setSelectedLocation: (location?: Location) => void;
  onLocationSelected?: (location: Location) => void;
  fullWidth?: boolean;
}

export function LocationSelector({
  locations,
  selectedLocation,
  setSelectedLocation,
  onLocationSelected,
  fullWidth = false,
}: LocationSelectorMobileProps) {
  return (
    <StyledSelect
      value={selectedLocation?.id ?? -1}
      onChange={async (ev) => {
        const location = locations.get(ev.target.value as number);
        if (!isDefined(location)) return;
        setSelectedLocation(location);
        onLocationSelected?.(location);
      }}
      fullWidth={fullWidth}
    >
      <MenuItem value={-1} disabled>
        Select Location
      </MenuItem>

      {Array.from(locations).map(([idx, location]) => (
        <MenuItem key={location.id} value={idx}>
          {location.name}
        </MenuItem>
      ))}
    </StyledSelect>
  );
}
