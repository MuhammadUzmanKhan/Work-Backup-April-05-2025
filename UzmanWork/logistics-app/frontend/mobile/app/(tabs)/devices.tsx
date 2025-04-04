import { Text, FlatList, View } from "react-native";
import { useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCamerasList } from "coram-common-utils";
import { Button, ButtonText, HStack, Spinner } from "@gluestack-ui/themed";
import { Link, useFocusEffect } from "expo-router";

function Devices() {
  const { data: cameras, isLoading, refetch } = useCamerasList({});
  // TODO(@lberg): this looks like a hack, but I don't know how to fix it
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <Text>devices</Text>
      {isLoading && <Spinner size="large" />}
      <View style={{ height: "50%" }}>
        <FlatList
          data={cameras}
          renderItem={({ item }) => (
            <HStack>
              <Text>{item.camera.name}</Text>
              <Link href={`/timeline/${item.camera.id}`} asChild>
                <Button>
                  <ButtonText>
                    <Text>View</Text>
                  </ButtonText>
                </Button>
              </Link>
            </HStack>
          )}
          keyExtractor={(item) => item.camera.id.toString()}
        />
      </View>
    </SafeAreaView>
  );
}

export default Devices;
