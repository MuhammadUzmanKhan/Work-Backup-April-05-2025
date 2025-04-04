import { useCallback, useState } from "react";
import { useCustomHeader } from "hooks/custom_header";
import { PersonPage } from "./analytics/PersonPage";
import { Stack } from "@mui/material";
import AnalyticsHeader, {
  AnalyticsTabOption,
} from "components/analytics/AnalyticsHeader";
import { LicensePlatesDefaultView } from "components/analytics/license_plates/LicensePlatesDefaultView";

export default function AnalyticsSearchPage() {
  // Initialized tabs states,so the page can controls the tab
  const [selectedTab, setSelectedTab] = useState(AnalyticsTabOption.Person);

  useCustomHeader(
    useCallback(
      () => (
        <AnalyticsHeader
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        />
      ),
      [selectedTab, setSelectedTab]
    )
  );

  const getSelectedTab = (tab: AnalyticsTabOption) => {
    switch (tab) {
      case AnalyticsTabOption.LicensePlates:
        return <LicensePlatesDefaultView />;
      default:
        return <PersonPage />;
    }
  };

  return (
    <Stack
      sx={{
        height: "100vh",
        backgroundColor: "common.white",
      }}
      gap={2}
    >
      {getSelectedTab(selectedTab)}
    </Stack>
  );
}
