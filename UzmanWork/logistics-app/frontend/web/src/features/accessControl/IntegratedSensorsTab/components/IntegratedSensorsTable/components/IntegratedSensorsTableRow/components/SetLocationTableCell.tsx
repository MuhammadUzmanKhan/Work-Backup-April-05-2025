import { StyledSelect } from "components/styled_components/StyledSelect";
import type { SelectChangeEvent } from "@mui/material";
import { CircularProgress, MenuItem, Stack, TableCell } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { AccessControlService, Location } from "coram-common-utils";
import { NotificationContext } from "contexts/notification_context";
import { QueryObserverResult } from "react-query";
import { AccessPointResponse } from "features/accessControl/types";

export interface SetLocationTableCellProps {
  accessPoint: AccessPointResponse;
  locations: Map<number, Location>;
  refetchAccessPoints: () => Promise<
    QueryObserverResult<AccessPointResponse[]>
  >;
}

export function SetLocationTableCell({
  accessPoint,
  locations,
  refetchAccessPoints,
}: SetLocationTableCellProps) {
  const [locationId, setLocationId] = useState<number | null>(
    accessPoint.location_id
  );

  const { setNotificationData } = useContext(NotificationContext);

  useEffect(() => {
    setLocationId(accessPoint.location_id);
  }, [accessPoint.location_id]);

  const [setLocationPending, setSetLocationPending] = useState(false);

  async function handleSetLocation(e: SelectChangeEvent<unknown>) {
    const value = e.target.value as number | "";
    const locationId = value === "" ? null : value;
    try {
      setLocationId(locationId);
      setSetLocationPending(true);
      await AccessControlService.setLocation({
        access_point_id: accessPoint.id,
        vendor: accessPoint.vendor,
        location_id: locationId ?? undefined,
      });
    } catch (e) {
      setNotificationData({
        message: "Failed to set Access Control Location.",
        severity: "error",
      });
      console.error(e);
    } finally {
      await refetchAccessPoints();
      setSetLocationPending(false);
    }
  }

  return (
    <TableCell>
      <StyledSelect
        fullWidth
        value={locationId ?? ""}
        onChange={handleSetLocation}
        displayEmpty
        disabled={setLocationPending}
        renderValue={(value: unknown) => {
          const valueNumber = value as number | "";
          return (
            <Stack alignItems="center" direction="row" gap={2}>
              {valueNumber != ""
                ? locations.get(valueNumber)?.name ?? "Unknown"
                : "Not selected"}
              {setLocationPending && (
                <CircularProgress size={18} color="secondary" />
              )}
            </Stack>
          );
        }}
      >
        <MenuItem value="">Not selected</MenuItem>
        {[...locations.values()].map((location) => (
          <MenuItem key={location.id} value={location.id}>
            {location.name}
          </MenuItem>
        ))}
      </StyledSelect>
    </TableCell>
  );
}
