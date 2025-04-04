import { Pressable, View } from "react-native";
import { ChevronLeftIcon, ChevronRightIcon, Icon } from "@gluestack-ui/themed";

interface SimplePaginatorProps {
  numItems: number;
  itemsPerPage: number;
  page: number;
  setPage: (page: number) => void;
}

export function SimplePaginator({
  numItems,
  itemsPerPage,
  page,
  setPage,
}: SimplePaginatorProps) {
  const startPage = 0;
  const endPage = Math.ceil(numItems / itemsPerPage) - 1;

  return (
    <View
      style={{
        backgroundColor: "lightgrey",
        paddingVertical: 4,
        borderRadius: 4,
        paddingHorizontal: 6,
        gap: 24,
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: "row",
      }}
    >
      <Pressable
        style={({ pressed }) => [
          { opacity: page === startPage || pressed ? 0.5 : 1.0 },
        ]}
        disabled={page === startPage}
        onPress={() => setPage(Math.max(page - 1, startPage))}
      >
        <Icon as={ChevronLeftIcon} size="xl" />
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          { opacity: page === endPage || pressed ? 0.5 : 1.0 },
        ]}
        disabled={page === endPage}
        onPress={() => setPage(Math.min(page + 1, endPage))}
      >
        <Icon as={ChevronRightIcon} size="xl" />
      </Pressable>
    </View>
  );
}
