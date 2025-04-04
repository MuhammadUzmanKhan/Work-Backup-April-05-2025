import { Link } from "react-router-dom";
import { Tab, Tabs, Typography } from "@mui/material";
import { Dispatch, SetStateAction } from "react";
import { AccessControlPageTabOption } from "./consts";

interface AccessControlPageTabsProps {
  selectedTab: string;
  setSelectedTab: Dispatch<SetStateAction<AccessControlPageTabOption>>;
}

export function AccessControlPageTabs({
  selectedTab,
  setSelectedTab,
}: AccessControlPageTabsProps) {
  return (
    <Tabs value={selectedTab} onChange={(_, val) => setSelectedTab(val)}>
      <Tab
        component={Link}
        to="/integrations"
        label={<Typography variant="h2">Events</Typography>}
        value={AccessControlPageTabOption.Events}
      />
      <Tab
        component={Link}
        to="/integrations/sensors"
        label={<Typography variant="h2">Integrated Sensors</Typography>}
        value={AccessControlPageTabOption.IntegratedSensors}
      />
      <Tab
        component={Link}
        to="/integrations/settings"
        label={<Typography variant="h2">Integrations</Typography>}
        value={AccessControlPageTabOption.Integrations}
      />
    </Tabs>
  );
}
