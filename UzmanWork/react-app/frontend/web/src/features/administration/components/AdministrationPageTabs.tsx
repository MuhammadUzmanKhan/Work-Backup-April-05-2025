import { Link } from "react-router-dom";
import { Tab, Tabs, Typography } from "@mui/material";
import { Dispatch, SetStateAction } from "react";
import { AdministrationPageTabOption } from "../types";

interface AdministrationPageTabsProps {
  selectedTab: AdministrationPageTabOption;
  setSelectedTab: Dispatch<SetStateAction<AdministrationPageTabOption>>;
}

export function AdministrationPageTabs({
  selectedTab,
  setSelectedTab,
}: AdministrationPageTabsProps) {
  return (
    <Tabs value={selectedTab} onChange={(_, val) => setSelectedTab(val)}>
      <Tab
        component={Link}
        to="/administration"
        label={<Typography variant="h2">Organisations</Typography>}
        value="organisations"
      />
      <Tab
        component={Link}
        to="/administration/cvrs"
        label={<Typography variant="h2">CVRs</Typography>}
        value="nvrs"
      />
      <Tab
        component={Link}
        to="/administration/cameras"
        label={<Typography variant="h2">Cameras</Typography>}
        value="cameras"
      />
    </Tabs>
  );
}
