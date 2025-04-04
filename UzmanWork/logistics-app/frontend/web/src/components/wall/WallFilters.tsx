import { KeyboardArrowDown as KeyboardArrowDownIcon } from "@mui/icons-material";
import { Divider, MenuItem, Stack, Typography } from "@mui/material";
import {
  CameraGroupWithLocations,
  Location,
  Organization,
  isDefined,
} from "coram-common-utils";
import { useIsMobile } from "components/layout/MobileOnly";
import { StyledSelect } from "components/styled_components/StyledSelect";
import { useEffect, useMemo } from "react";
import { filterCameraGroupsByLocation } from "utils/streams";

export type WallParams = {
  cameraGroup: CameraGroupWithLocations | undefined;
  location: Location | undefined;
  organization: Organization | null;
};

const iconStyles = {
  pointerEvents: "none",
  position: "absolute",
  right: "0.3rem",
  color: "neutral.1000",
  fontSize: "1.2rem",
  cursor: "pointer",
};

const ALL_GROUPS_VALUE = -1;

interface WallFiltersProps {
  locations: Map<number, Location>;
  groups: Map<number, CameraGroupWithLocations>;
  wallParams: WallParams;
  setWallParams: (wallParams: WallParams) => void;
  disabled?: boolean;
  onChange: () => void;
}

export function WallFilters({
  locations,
  groups,
  wallParams,
  setWallParams,
  disabled = false,
  onChange,
}: WallFiltersProps) {
  // Whether we are on a mobile device
  const isMobile = useIsMobile();

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

  // Render locations and sort them alphabetically
  const locationItems = useMemo(
    () =>
      Array.from(locations ?? [])
        .sort(([, locA], [, locB]) => locA.name.localeCompare(locB.name))
        .map(([, loc]) => (
          <MenuItem key={loc.id} value={loc.id}>
            <Typography variant="body2" component="span">
              {loc.name}
            </Typography>
          </MenuItem>
        )),
    [locations]
  );

  // Render groups for the current location and sort them alphabetically
  const groupsItems = useMemo(() => {
    const menuItems = Array.from(
      filterCameraGroupsByLocation(wallParams.location?.id, [
        ...(groups?.values() ?? []),
      ])
    )
      .sort(([, groupA], [, groupB]) => groupA.name.localeCompare(groupB.name))
      .map(([camera_group_id, camera_group]) => (
        <MenuItem key={camera_group_id} value={camera_group_id}>
          <Typography variant="body2" component="span">
            {camera_group.name}
          </Typography>
        </MenuItem>
      ));

    return [
      <MenuItem key={ALL_GROUPS_VALUE} value={ALL_GROUPS_VALUE}>
        <Typography variant="body2" component="span">
          All groups
        </Typography>
      </MenuItem>,
      <Divider key="divider" variant="middle" />,
      ...menuItems,
    ];
  }, [groups, wallParams.location]);

  return (
    <Stack
      direction="row"
      columnGap={1}
      width="100%"
      justifyContent={isMobile ? "space-between" : "left"}
    >
      <StyledSelect
        disabled={disabled}
        value={wallParams.location?.id ?? ""}
        sx={{
          width: isMobile ? "50%" : "130px",
          "& .MuiSelect-select": {
            overflow: "hidden",
            maxWidth: isMobile ? "100px" : "auto",
          },
        }}
        onChange={(ev) => {
          if (!locations || !groups) return;
          const location = locations.get(ev.target.value as number);
          setWallParams({
            ...wallParams,
            location: location,
            cameraGroup: undefined,
          });
          onChange();
        }}
        IconComponent={(props) => (
          <KeyboardArrowDownIcon {...props} sx={{ ...iconStyles }} />
        )}
      >
        {locationItems}
      </StyledSelect>

      <StyledSelect
        disabled={disabled}
        value={wallParams.cameraGroup?.id ?? ALL_GROUPS_VALUE}
        sx={{
          width: isMobile ? "50%" : "130px",
          "& .MuiSelect-select": {
            overflow: "hidden",
            maxWidth: isMobile ? "100px" : "auto",
          },
        }}
        onChange={(ev) => {
          setWallParams({
            ...wallParams,
            cameraGroup: groups?.get(ev.target.value as number),
          });
          onChange();
        }}
        IconComponent={(props) => (
          <KeyboardArrowDownIcon {...props} sx={{ ...iconStyles }} />
        )}
      >
        {groupsItems}
      </StyledSelect>
    </Stack>
  );
}
