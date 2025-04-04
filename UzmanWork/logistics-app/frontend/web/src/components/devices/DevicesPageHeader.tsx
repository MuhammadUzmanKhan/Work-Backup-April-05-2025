import { Tab, Tabs, Typography } from "@mui/material";

export enum DevicesTabOption {
  Cameras = "Cameras",
  Appliances = "Appliances",
  Locations = "Locations",
}

export function DevicesPageHeader({
  selectedTab,
  setSelectedTab,
}: {
  selectedTab: string;
  setSelectedTab: (tab: DevicesTabOption) => void;
}) {
  return (
    <Tabs value={selectedTab} onChange={(_, val) => setSelectedTab(val)}>
      <Tab
        label={<Typography variant="h2">Cameras</Typography>}
        value={DevicesTabOption.Cameras}
      />
      <Tab
        label={<Typography variant="h2">Appliances</Typography>}
        value={DevicesTabOption.Appliances}
      />
      <Tab
        label={<Typography variant="h2">Locations</Typography>}
        value={DevicesTabOption.Locations}
      />
    </Tabs>
  );
}
