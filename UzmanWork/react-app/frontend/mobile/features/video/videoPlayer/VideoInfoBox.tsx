import { View, Image } from "react-native";
import React from "react";

interface VideoInfoBoxProps {
  posterURL?: string;
  children: React.ReactNode;
}

export function VideoInfoBox({ posterURL, children }: VideoInfoBoxProps) {
  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        source={{ uri: posterURL }}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          resizeMode: "contain",
          opacity: 0.5,
        }}
      />
      {children}
    </View>
  );
}
