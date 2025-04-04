import { Stack, Typography } from "@mui/material";
import { ReactNode } from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { DatasourceCamerasList } from "./components";

interface EditDataSourceProps {
  title: string;
  datasourceCameraMacAddresses: string[];
  selectedDataSourceCameraMacAddress?: string;
  onSelectedCameraMacAddressChange: (macAddress: string) => void;
  children: ReactNode;
}

export function EditDataSource({
  title,
  datasourceCameraMacAddresses,
  selectedDataSourceCameraMacAddress,
  onSelectedCameraMacAddressChange,
  children,
}: EditDataSourceProps) {
  return (
    <Grid container spacing={2}>
      <Grid xs={5}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="body1" color="#83889E" py={1.5}>
            {title}
          </Typography>
        </Stack>
        <DatasourceCamerasList
          datasourceCameraMacAddresses={datasourceCameraMacAddresses}
          onSelectedCameraMacAddressChange={onSelectedCameraMacAddressChange}
          selectedCameraMacAddress={selectedDataSourceCameraMacAddress}
        />
      </Grid>
      <Grid xs={7}>{children}</Grid>
    </Grid>
  );
}
