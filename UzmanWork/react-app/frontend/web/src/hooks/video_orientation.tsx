import { useCallback, useEffect } from "react";
import { HTMLMediaElementIOS } from "./video_player";
import { ScreenOrientation } from "@capacitor/screen-orientation";

export function useAutoExitFullscreenOnPortrait(
  videoRef: HTMLVideoElement | undefined,
  enabled: boolean
) {
  const videoRefIOS = videoRef as unknown as HTMLMediaElementIOS;

  const onNewOrientation = useCallback(async () => {
    if (!videoRef) {
      return;
    }
    const result = await ScreenOrientation.orientation();
    if (result.type === "portrait-primary") {
      // Portrait mode - Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (videoRefIOS.webkitExitFullscreen) {
        const videoIsPlaying = !videoRef.paused;
        videoRefIOS.webkitExitFullscreen();
        // NOTE(@lberg): for some unknown reason,
        // the video is always paused when exiting fullscreen
        // on iOS.
        setTimeout(() => {
          if (videoIsPlaying) {
            videoRefIOS.play();
          }
        }, 1000);
      }
    }
  }, [videoRef, videoRefIOS]);

  useEffect(() => {
    const addScreenOrientationListener = async () => {
      await ScreenOrientation.addListener(
        "screenOrientationChange",
        onNewOrientation
      );
    };

    const removeScreenOrientationListener = async () => {
      await ScreenOrientation.removeAllListeners();
    };

    if (!enabled) {
      return;
    }
    addScreenOrientationListener();

    return () => {
      removeScreenOrientationListener();
    };
  }, [onNewOrientation, enabled]);
}
