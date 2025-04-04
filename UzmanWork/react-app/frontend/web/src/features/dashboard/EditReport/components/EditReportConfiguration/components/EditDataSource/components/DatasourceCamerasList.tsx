import { List, ListItemButton } from "@mui/material";
import { useCameraNames } from "coram-common-utils";

interface DatasourceCamerasListProps {
  datasourceCameraMacAddresses: string[];
  selectedCameraMacAddress?: string;
  onSelectedCameraMacAddressChange: (macAddress: string) => void;
}

export function DatasourceCamerasList({
  datasourceCameraMacAddresses,
  selectedCameraMacAddress,
  onSelectedCameraMacAddressChange,
}: DatasourceCamerasListProps) {
  const camerasNames = useCameraNames({
    excludeDisabled: false,
    refetchOnWindowFocus: false,
  });

  return (
    <List>
      {datasourceCameraMacAddresses.map((cameraMacAddress) => (
        <ListItemButton
          key={cameraMacAddress}
          selected={selectedCameraMacAddress === cameraMacAddress}
          onClick={() => onSelectedCameraMacAddressChange(cameraMacAddress)}
          sx={{
            borderRadius: "0.4rem",
            "&:hover, &.Mui-selected": {
              bgcolor: "#F2F5FA",
            },
          }}
        >
          {camerasNames.get(cameraMacAddress) ?? "Unknown camera"}
        </ListItemButton>
      ))}
    </List>
  );
}
