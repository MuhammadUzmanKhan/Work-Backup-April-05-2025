import { Stack } from "@mui/material";
import { Location } from "coram-common-utils";
import { SearchInput } from "components/devices/SearchInput";
import { LocationSelector } from "./LocationSelector";

interface ControlsProps {
  locations: Map<number, Location>;
  selectedLocation?: Location;
  setSelectedLocation: (location?: Location) => void;
  searchQuery: string;
  onSearchQueryChange: (searchQuery: string) => void;
  onLocationSelected?: (location: Location) => void;
}

export function Controls({
  locations,
  selectedLocation,
  setSelectedLocation,
  searchQuery,
  onSearchQueryChange,
  onLocationSelected,
}: ControlsProps) {
  return (
    <Stack direction="row" width="100%" justifyContent="space-between">
      <LocationSelector
        locations={locations}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        onLocationSelected={onLocationSelected}
      />

      <Stack gap={2} direction="row">
        <SearchInput
          placeHolder="Search"
          onChange={onSearchQueryChange}
          value={searchQuery}
        />
      </Stack>
    </Stack>
  );
}
