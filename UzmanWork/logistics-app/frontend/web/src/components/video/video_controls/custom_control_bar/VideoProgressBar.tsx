import { Box, LinearProgress } from "@mui/material";
import type { SxProps } from "@mui/material";
import { bufferProgressPerc, onVideoSeek } from "./utils";
import { useState } from "react";
import { useElementSize } from "hooks/element_size";
import { Circle as CircleIcon } from "@mui/icons-material";

const SCRUB_BALL_SIZE = 16;

interface VideoProgressBarProps {
  videoRef: HTMLMediaElement;
  boxSx?: SxProps;
}

export function VideoProgressBar({ videoRef, boxSx }: VideoProgressBarProps) {
  const [progressPercentage, setProgressPercentage] = useState(
    (videoRef.currentTime / videoRef.duration) * 100
  );
  const [isScrubbing, setIsScrubbing] = useState(false);
  const {
    size: progressBarsize,
    setRef: setProgressBarRef,
    ref: progressBarRef,
  } = useElementSize();
  const [isHover, setIsHover] = useState(false);
  const videoPercentage = isScrubbing
    ? progressPercentage * 100
    : (videoRef.currentTime / videoRef.duration) * 100;

  return (
    <Box
      sx={{ ...boxSx, position: "relative" }}
      onMouseDown={(e) => {
        setIsScrubbing(true);
        if (progressBarRef !== null) {
          onVideoSeek(
            e.nativeEvent,
            progressBarRef,
            videoRef,
            setProgressPercentage
          );
        }
      }}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      onMouseUp={() => setIsHover(false)}
      onTouchStart={() => setIsScrubbing(true)}
      onTouchEnd={() => setIsScrubbing(false)}
      onTouchMove={(e) => {
        if (progressBarRef !== null) {
          onVideoSeek(
            e.nativeEvent,
            progressBarRef,
            videoRef,
            setProgressPercentage
          );
        }
      }}
    >
      <LinearProgress
        variant="buffer"
        ref={setProgressBarRef}
        value={videoPercentage}
        valueBuffer={bufferProgressPerc(videoRef)}
        sx={{
          cursor: "pointer",
          "& .MuiLinearProgress-bar1Buffer": {
            backgroundColor: "common.white",
          },
          "& .MuiLinearProgress-bar2Buffer": {
            backgroundColor: "#9ea3c9",
          },
          transition: "transform 0.2s ease-in-out",
          "& .MuiLinearProgress-dashed": {
            backgroundColor: "rgba(255, 255, 255, 0.3)",
            backgroundImage: "none",
            animation: "none",
          },
          "& .MuiLinearProgress-bar": {
            transition: "none",
          },
        }}
      />
      {isHover && (
        <CircleIcon
          sx={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            left:
              (videoPercentage / 100) * progressBarsize.width -
              SCRUB_BALL_SIZE / 2,
            width: SCRUB_BALL_SIZE,
            height: SCRUB_BALL_SIZE,
          }}
        />
      )}

      {isScrubbing && (
        <Box
          position="fixed"
          top="0"
          left="0"
          width="100%"
          height="100%"
          zIndex={1000}
          onMouseUp={() => setIsScrubbing(false)}
          onMouseMove={(e) => {
            if (progressBarRef !== null) {
              onVideoSeek(
                e.nativeEvent,
                progressBarRef,
                videoRef,
                setProgressPercentage
              );
            }
          }}
          onTouchStart={() => setIsScrubbing(true)}
          onTouchEnd={() => setIsScrubbing(false)}
          onTouchMove={(e) => {
            if (progressBarRef !== null) {
              onVideoSeek(
                e.nativeEvent,
                progressBarRef,
                videoRef,
                setProgressPercentage
              );
            }
          }}
        ></Box>
      )}
    </Box>
  );
}
