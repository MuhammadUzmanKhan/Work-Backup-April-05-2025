import { useState } from "react";
import { Stack } from "@mui/material";

import { AppHeader, AppTabOption } from "./components/AppHeader";
import { HomePage } from "./pages/HomePage";
import { ListingsPage } from "./pages/ListingsPage";
import { InsertionFormPage } from "./pages/InsertionFormPage";
import { ChatPrompterPage } from "./pages/ChatPrompterPage";

function App() {
  // Initialized tabs states, so the page can control the tab
  const [selectedTab, setSelectedTab] = useState<AppTabOption>(
    AppTabOption.Home
  );

  const handleTabChange = (tab: AppTabOption) => {
    setSelectedTab(tab);
  };

  const getSelectedTab = (tab: AppTabOption) => {
    switch (tab) {
      case AppTabOption.Listings:
        return <ListingsPage />;
      case AppTabOption.InsertionForm:
        return <InsertionFormPage />;
      case AppTabOption.ChatPrompter:
        return <ChatPrompterPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <Stack
      sx={{
        height: "100vh",
        //  backgroundColor: "common.white"
        backgroundColor: "black",
        color: "common.white",
      }}
      gap={2}
    >
      <AppHeader selectedTab={selectedTab} setSelectedTab={handleTabChange} />

      {getSelectedTab(selectedTab)}
    </Stack>
  );
}

export default App;
