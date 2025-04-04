import { Stack } from "@mui/material";
import {
  EventsTab,
  IntegratedSensorsTab,
  IntegrationsTab,
} from "features/accessControl";
import { useCustomHeader } from "hooks/custom_header";
import { useCallback, useState } from "react";
import { useOnMount } from "hooks/lifetime";
import {
  AccessControlPageTabOption,
  AccessControlPageTabs,
} from "./components";

export interface AccessControlPageProps {
  tab: AccessControlPageTabOption;
}

export function AccessControlPage({ tab }: AccessControlPageProps) {
  const [selectedTab, setSelectedTab] = useState<AccessControlPageTabOption>(
    AccessControlPageTabOption.Events
  );

  useOnMount(() => setSelectedTab(tab));

  useCustomHeader(
    useCallback(
      () => (
        <AccessControlPageTabs
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        />
      ),
      [selectedTab, setSelectedTab]
    )
  );

  const getSelectedTab = (tab: AccessControlPageTabOption) => {
    switch (tab) {
      case AccessControlPageTabOption.IntegratedSensors:
        return <IntegratedSensorsTab />;
      case AccessControlPageTabOption.Integrations:
        return <IntegrationsTab />;
      case AccessControlPageTabOption.Events:
      default:
        return <EventsTab />;
    }
  };

  return (
    <Stack p={3} gap={2} height="92vh" bgcolor="common.white">
      {getSelectedTab(selectedTab)}
    </Stack>
  );
}
