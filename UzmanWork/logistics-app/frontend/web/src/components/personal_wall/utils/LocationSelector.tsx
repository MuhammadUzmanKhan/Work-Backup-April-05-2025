import { MenuItem, Select, Typography } from "@mui/material";
import { KeyboardArrowDown as KeyboardArrowDownIcon } from "@mui/icons-material";
import { Location, useLocations } from "coram-common-utils";
import { grey } from "@mui/material/colors";
import { Dispatch, SetStateAction } from "react";

const iconStyles = {
  pointerEvents: "none",
  position: "absolute",
  right: "0.3rem",
  color: "neutral.1000",
  fontSize: "1.2rem",
  cursor: "pointer",
};

const selectorStyles = {
  position: "relative",
  fontWeight: "200",
  minWidth: "11rem",
  borderRadius: "0.2rem",
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "neutral.1000",
  },
  "& .MuiOutlinedInput-input": {
    color: "neutral.1000",
  },
  "& .MuiSelect-outlined": {
    p: 1,
    px: 2,
  },
};

interface LocationSelectorProps {
  selectedLocation: Location | undefined;
  setSelectedLocation: Dispatch<SetStateAction<Location | undefined>>;
}

export function LocationSelector({
  selectedLocation,
  setSelectedLocation,
}: LocationSelectorProps) {
  const { data: locations } = useLocations(false);
  if (!locations || locations.size <= 1) return <></>;

  const locationItems = [
    <MenuItem key={-1} value={-1}>
      {"(All Locations)"}
    </MenuItem>,
  ].concat(
    Array.from(locations)
      .sort(([, locA], [, locB]) => locA.name.localeCompare(locB.name))
      .map(([, loc]) => (
        <MenuItem key={loc.id} value={loc.id}>
          {loc.name}
        </MenuItem>
      ))
  );

  return (
    <Select
      value={selectedLocation !== undefined ? selectedLocation.id : -1}
      IconComponent={(props) => (
        <KeyboardArrowDownIcon {...props} sx={{ ...iconStyles }} />
      )}
      onChange={(ev) => {
        if (Number(ev.target.value) == -1) {
          setSelectedLocation(undefined);
          return;
        }
        setSelectedLocation(locations.get(ev.target.value as number));
      }}
      sx={{
        ...selectorStyles,
        marginBottom: "10px",
      }}
      displayEmpty
      renderValue={() => {
        if (selectedLocation === undefined) {
          return (
            <Typography variant="body2" sx={{ color: grey[600] }}>
              Select Location
            </Typography>
          );
        }
        return selectedLocation.name;
      }}
    >
      {locationItems}
    </Select>
  );
}
