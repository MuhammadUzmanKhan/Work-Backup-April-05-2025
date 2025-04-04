import React from "react";
import { Stack, Tab, Tabs, Typography } from "@mui/material";
import { SearchIcon } from "../icons/search-icon";

export enum AppTabOption {
  Home = "home",
  Listings = "listings",
  InsertionForm = "insertion_form",
  ChatPrompter = "chat_prompter",
}

export function AppHeader({
  selectedTab,
  setSelectedTab,
}: {
  selectedTab: string;
  setSelectedTab: React.Dispatch<React.SetStateAction<AppTabOption>>;
}) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      p={0.5}
      alignItems="center"
    >
      <Tabs
        value={selectedTab}
        onChange={(ev: React.SyntheticEvent, val) => setSelectedTab(val)}
        sx={{
          color: "#C6D57E",
          "& .MuiTabs-indicator": {
            backgroundColor: "#C6D57E !important",
          },
        }}
      >
        <Tab
          label={<Typography variant="body1">Home</Typography>}
          value={AppTabOption.Home}
          sx={{
            color: selectedTab === AppTabOption.Home ? "#C6D57E" : "#FFFFFF",
            "&.Mui-selected": {
              color: "inherit",
            },
          }}
        />
        <Tab
          label={<Typography variant="body1">Listings</Typography>}
          value={AppTabOption.Listings}
          sx={{
            color:
              selectedTab === AppTabOption.Listings ? "#C6D57E" : "#FFFFFF",
            "&.Mui-selected": {
              color: "inherit",
            },
          }}
        />
        <Tab
          label={<Typography variant="body1">Insertion Form</Typography>}
          value={AppTabOption.InsertionForm}
          sx={{
            color:
              selectedTab === AppTabOption.InsertionForm
                ? "#C6D57E"
                : "#FFFFFF",
            "&.Mui-selected": {
              color: "inherit",
            },
          }}
        />
        <Tab
          label={<Typography variant="body1">Chat Prompter</Typography>}
          value={AppTabOption.ChatPrompter}
          sx={{
            color:
              selectedTab === AppTabOption.ChatPrompter ? "#C6D57E" : "#FFFFFF",
            "&.Mui-selected": {
              color: "inherit",
            },
          }}
        />
      </Tabs>
      <SearchIcon />
    </Stack>
  );
}
