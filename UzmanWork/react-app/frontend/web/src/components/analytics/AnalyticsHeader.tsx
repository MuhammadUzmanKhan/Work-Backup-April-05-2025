import React from "react";
import { Tab, Tabs, Typography } from "@mui/material";

export enum AnalyticsTabOption {
  Person = "person",
  Dashboard = "dashboard",
  LicensePlates = "license_plates",
}

function AnalyticsHeader({
  selectedTab,
  setSelectedTab,
}: {
  selectedTab: string;
  setSelectedTab: React.Dispatch<React.SetStateAction<AnalyticsTabOption>>;
}) {
  return (
    <Tabs
      value={selectedTab}
      onChange={(ev: React.SyntheticEvent, val) => setSelectedTab(val)}
    >
      <Tab
        label={<Typography variant="h2">Person</Typography>}
        value={AnalyticsTabOption.Person}
      />
      {/* Hide the analytics tab for now as there is nothing to show
      <Tab
        label="Dashboard"
        value={AnalyticsTabOption.Dashboard}
      /> */}
      <Tab
        label={<Typography variant="h2">License Plates</Typography>}
        value={AnalyticsTabOption.LicensePlates}
      />
    </Tabs>
  );
}

export default AnalyticsHeader;
