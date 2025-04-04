import { Box, Tab, Tabs, Typography } from "@mui/material";
import { TAB_STYLE } from "pages/analytics/utils";

export type CameraSettingsDrawerTab = "settings" | "health" | "errors";

const TABS = [
  { label: "Settings", value: "settings" },
  { label: "Health", value: "health" },
  { label: "Recent Errors", value: "errors" },
];

interface CameraSettingsDrawerTabsProps {
  activeTab: CameraSettingsDrawerTab;
  onChangeTab: (tab: CameraSettingsDrawerTab) => void;
}

export function CameraSettingsDrawerTabs({
  activeTab,
  onChangeTab,
}: CameraSettingsDrawerTabsProps) {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      borderBottom="1px solid"
      borderColor="neutral.A400"
    >
      <Tabs
        value={activeTab}
        onChange={(_, val) => onChangeTab(val)}
        TabIndicatorProps={{ sx: { display: "none" } }}
        sx={{
          position: "relative",
          top: "9px",
        }}
      >
        {TABS.map((tab) => (
          <Tab
            key={tab.value}
            label={<Typography variant="h3">{tab.label}</Typography>}
            value={tab.value}
            sx={TAB_STYLE}
          />
        ))}
      </Tabs>
    </Box>
  );
}
