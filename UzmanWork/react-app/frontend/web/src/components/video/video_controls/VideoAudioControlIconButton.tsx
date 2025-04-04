import { Tooltip } from "@mui/material";
import { VolumeUpIcon } from "icons/volume-up-icon";
import { VolumeOffIcon } from "icons/volume-off-icon";
import { ActionButton } from "components/styled_components/ActionButton";

interface VideoAudioControlButtonProps {
  video: HTMLVideoElement;
}

export function VideoAudioControlButton({
  video,
}: VideoAudioControlButtonProps) {
  function toggleVolume() {
    // toggle between mute and unmute
    if (video.muted) {
      video.muted = false;
      return;
    }
    video.muted = true;
  }

  return (
    <Tooltip
      title={video.muted ? "Click to unmute" : "Click to mute"}
      placement="bottom"
    >
      <ActionButton onClick={toggleVolume}>
        {video.muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
      </ActionButton>
    </Tooltip>
  );
}

export function VideoAudioControlButtonDisabled() {
  return (
    <ActionButton disabled>
      <VolumeOffIcon />
    </ActionButton>
  );
}
