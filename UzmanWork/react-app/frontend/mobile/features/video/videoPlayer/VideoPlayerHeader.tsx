import { Badge, BadgeText } from "@gluestack-ui/themed";
import { View, Text } from "react-native";

interface VideoPlayerHeaderProps {
  isLive: boolean;
  name: string;
}

export default function VideoPlayerHeader({
  isLive,
  name,
}: VideoPlayerHeaderProps) {
  return (
    <View
      style={{
        width: "100%",
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "grey",
      }}
    >
      <Badge size="md" variant="solid" borderRadius="$none" action="success">
        <BadgeText>{isLive ? "LIVE" : "REPLAY"}</BadgeText>
      </Badge>
      <Text style={{ color: "white" }}>{name}</Text>
    </View>
  );
}
