import { View } from "react-native";
import VideoPlayerHeader from "./VideoPlayerHeader";

interface VideoPlayerContainerProps {
  isLive: boolean;
  name: string;
  children: React.ReactNode;
}

export function VideoPlayerContainer({
  isLive,
  name,
  children,
}: VideoPlayerContainerProps) {
  return (
    <View>
      <VideoPlayerHeader isLive={isLive} name={name} />
      <View
        style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "black" }}
      >
        {children}
      </View>
    </View>
  );
}
