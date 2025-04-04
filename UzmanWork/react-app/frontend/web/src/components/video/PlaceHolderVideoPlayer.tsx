import { useTheme } from "@mui/material";
import { VideoTimeInfo, VideoTopBar } from "./VideoTopBar";
import { VideoContainer, VideoPlayerContainer } from "./Containers";
import React, { MouseEvent } from "react";

interface PlaceHolderVideoPlayerProps {
  videoName?: string;
  showBorder: boolean;
  videoTimeInfo?: VideoTimeInfo;
  onClick?: (ev: MouseEvent<HTMLDivElement>) => void;
  aspectRatio?: string;
  children: React.ReactNode;
}

export function PlaceHolderVideoPlayer({
  videoName,
  showBorder,
  videoTimeInfo,
  onClick,
  children,
  aspectRatio = "16/9",
}: PlaceHolderVideoPlayerProps) {
  const theme = useTheme();

  return (
    <VideoPlayerContainer
      onPointerUp={onClick}
      border={showBorder ? "1px solid" : "none"}
    >
      <VideoTopBar videoTimeInfo={videoTimeInfo} videoName={videoName} />
      <VideoContainer
        bgcolor={theme.palette.common.black}
        sx={{
          aspectRatio: aspectRatio,
        }}
      >
        {children}
      </VideoContainer>
    </VideoPlayerContainer>
  );
}
