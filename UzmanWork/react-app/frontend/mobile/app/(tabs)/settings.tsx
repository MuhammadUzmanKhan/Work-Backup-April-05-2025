import { Text } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOrganizationContext } from "coram-common-utils";
import { router } from "expo-router";
import { useAuth0 } from "react-native-auth0";
import { Button, ButtonText, SelectItem } from "@gluestack-ui/themed";
import { useSelectedOrganization } from "coram-common-utils/src/hooks/organizations";
import {
  getOrganizationIdInStorage,
  setOrganizationIdInStorage,
} from "../../features/organizations/utils";
import { ScrollableSelect } from "../../components/ScrollableSelect";

function SettingsView() {
  const orgData = useOrganizationContext();
  const { clearSession } = useAuth0();
  const { organizations, setOrganization } = useSelectedOrganization({
    setOrganizationIdInStorage,
    getOrganizationIdInStorage,
  });
  const [isOpened, setIsOpened] = React.useState(false);

  async function onLogout() {
    try {
      await clearSession();
      router.replace("/login");
    } catch (e) {
      console.error(`error logging out: ${e}`);
    }
  }

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <Text>Organization:</Text>

      <ScrollableSelect
        isOpened={isOpened}
        setIsOpened={setIsOpened}
        selectedValue={orgData.organization.name}
        sx={{ minWidth: "50%" }}
      >
        {[...organizations.values()]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((org) => (
            <SelectItem
              key={org.id}
              label={org.name}
              value={String(org.id)}
              onPress={() => {
                setOrganization(org);
                setIsOpened(false);
              }}
            />
          ))}
      </ScrollableSelect>

      <Button size="md" variant="solid" action="primary" onPress={onLogout}>
        <ButtonText>Log Out</ButtonText>
      </Button>
    </SafeAreaView>
  );
}

export default SettingsView;
