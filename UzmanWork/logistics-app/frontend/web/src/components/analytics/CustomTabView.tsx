import { ReactNode } from "react";
import { Box, Tab } from "@mui/material";
import type { SxProps } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { isDefined } from "coram-common-utils";

interface TabItem {
  label: string;
  value: string;
  component: JSX.Element;
}

export const SUB_TABS_BOX_HEIGHT_PX = 60;

interface CustomTabViewProps<T extends string> {
  tabData: TabItem[];
  selectedTab: T;
  setSelectedTab: (tab: T) => void;
  tabStyle: SxProps;
  rightViewControls?: ReactNode;
}
//TODO(@slavasab):This component is in the wrong place now. Move this to the appropriate feature/module
function CustomTabView<T extends string>({
  tabData,
  selectedTab,
  setSelectedTab,
  tabStyle,
  rightViewControls,
}: CustomTabViewProps<T>) {
  return (
    <TabContext value={selectedTab}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        borderBottom="1px solid"
        borderColor="neutral.A400"
        minHeight={`${SUB_TABS_BOX_HEIGHT_PX}px`}
      >
        <TabList
          onChange={(_event, newValue) => {
            setSelectedTab(newValue);
          }}
          TabIndicatorProps={{
            sx: {
              display: "none",
            },
          }}
          sx={{
            position: "relative",
            top: "15px",
            pl: "1.125rem",
          }}
        >
          {tabData.map((tabItem) => (
            <Tab
              key={tabItem.value}
              label={tabItem.label}
              value={tabItem.value}
              sx={tabStyle}
            />
          ))}
        </TabList>
        {isDefined(rightViewControls) && rightViewControls}
      </Box>
      {tabData.map((tabItem) => (
        <TabPanel
          key={tabItem.value}
          value={tabItem.value}
          sx={{ padding: "0 20px" }}
        >
          {tabItem.component}
        </TabPanel>
      ))}
    </TabContext>
  );
}

export default CustomTabView;
