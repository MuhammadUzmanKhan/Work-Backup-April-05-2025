import { Tooltip } from "@mui/material";
import { ActionButton } from "components/styled_components/ActionButton";
import { useOnFullScreenChange } from "hooks/full_screen";
import { FullScreenIcon } from "icons/full-screen-icon";

export interface VideoControlIconButtonProps {
  video: HTMLVideoElement;
  onClick: VoidFunction;
}

export function VideoFullScreenControlButton({
  video,
  onClick,
}: VideoControlIconButtonProps) {
  function handleFullScreenChangedCb(video: HTMLVideoElement) {
    if (document.fullscreenElement) {
      video.style.width = "100%";
      return;
    }
    video.style.width = "auto";
  }

  useOnFullScreenChange(() => {
    video && handleFullScreenChangedCb(video);
  });
  return (
    <Tooltip title="Full screen" placement="bottom">
      <ActionButton onClick={onClick}>
        <FullScreenIcon />
      </ActionButton>
    </Tooltip>
  );
}

export function VideoFullScreenControlButtonDisabled() {
  return (
    <ActionButton disabled>
      <FullScreenIcon />
    </ActionButton>
  );
}
