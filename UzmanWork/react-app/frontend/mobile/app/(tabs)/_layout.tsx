import { Tabs } from "expo-router";
import { RequireAuthMobile } from "../../components/RequireAuthMobile";
import { RequireOrg } from "../../features/organizations/RequireOrg";

const TabsLayout = () => {
  return (
    <>
      <RequireAuthMobile>
        <RequireOrg>
          <Tabs>
            <Tabs.Screen
              name="index"
              options={{
                title: "Live Wall",
                headerShown: false,
              }}
            />
            <Tabs.Screen
              name="personalWall"
              options={{
                title: "Personal Wall",
                headerShown: false,
              }}
            />
            <Tabs.Screen
              name="devices"
              options={{
                title: "Devices",
                headerShown: false,
              }}
            />
            <Tabs.Screen
              name="settings"
              options={{
                title: "Settings",
                headerShown: false,
              }}
            />
          </Tabs>
        </RequireOrg>
      </RequireAuthMobile>
    </>
  );
};

export default TabsLayout;
