import { Stack } from "@mui/material";
import { useCallback, useState } from "react";
import { useCustomHeader } from "hooks/custom_header";
import { useOnMount } from "hooks/lifetime";
import {
  AdministrationPageTabs,
  CamerasTab,
  NVRsTab,
  OrganisationsTab,
} from "features/administration/components";
import { AdministrationPageTabOption } from "features/administration/types";

interface AdministrationPageProps {
  tab: AdministrationPageTabOption;
}

export function AdministrationPage({ tab }: AdministrationPageProps) {
  const [selectedTab, setSelectedTab] =
    useState<AdministrationPageTabOption>("organisations");

  useOnMount(() => setSelectedTab(tab));

  useCustomHeader(
    useCallback(
      () => (
        <AdministrationPageTabs
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        />
      ),
      [selectedTab, setSelectedTab]
    )
  );

  const getSelectedTab = (tab: AdministrationPageTabOption) => {
    switch (tab) {
      case "cameras":
        return <CamerasTab />;
      case "nvrs":
        return <NVRsTab />;
      case "organisations":
      default:
        return <OrganisationsTab />;
    }
  };

  return (
    <Stack p={3} gap={2} height="92vh" bgcolor="common.white">
      {getSelectedTab(selectedTab)}
    </Stack>
  );
}
