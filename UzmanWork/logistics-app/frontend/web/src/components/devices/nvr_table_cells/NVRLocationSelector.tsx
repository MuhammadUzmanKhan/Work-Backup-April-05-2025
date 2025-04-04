import {
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useIsAdmin } from "components/layout/RoleGuards";
import { StyledSelect } from "components/styled_components/StyledSelect";
import { useUpdateNvrLocation } from "./hooks";
import { useLocations } from "coram-common-utils";

interface NVRLocationSelectorProps {
  nvrUuid: string;
  nvrLocationId: number | undefined;
  nvrLocationName: string | undefined;
}

export function NVRLocationSelector({
  nvrUuid,
  nvrLocationId,
  nvrLocationName,
}: NVRLocationSelectorProps) {
  const { data: locations } = useLocations();

  const { isLoading: isUpdatingNvrLocation, mutateAsync: updateNvrLocation } =
    useUpdateNvrLocation();

  const isAdmin = useIsAdmin();

  return (
    <StyledSelect
      fullWidth
      displayEmpty
      disabled={!isAdmin || isUpdatingNvrLocation}
      value={nvrLocationId ?? null}
      renderValue={() => {
        return (
          <Stack alignItems="center" direction="row" gap={2}>
            {nvrLocationName ?? "Select Location"}
            {isUpdatingNvrLocation && (
              <CircularProgress size={18} color="secondary" />
            )}
          </Stack>
        );
      }}
    >
      {Array.from(locations.values()).map((location) => (
        <MenuItem
          key={location.id}
          value={location.id}
          onClick={async () => {
            await updateNvrLocation({
              nvrUuid: nvrUuid,
              locationId: location.id,
            });
          }}
        >
          <Stack flexDirection="column" gap={1}>
            <Typography variant="h3">{location.name}</Typography>
            <Typography
              variant="body2"
              sx={{
                width: "250px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {location.address}
            </Typography>
            <Divider sx={{ width: "100%" }} />
          </Stack>
        </MenuItem>
      ))}
    </StyledSelect>
  );
}
