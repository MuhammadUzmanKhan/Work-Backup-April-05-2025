import { Stack } from "@mui/system";
import { LiveButton } from "components/video/LiveButton";
import { ZoomInIcon } from "icons/player/zoom-in-icon";
import { ZoomOutIcon } from "icons/player/zoom-out-icon";

interface RightControlsProps extends React.ComponentProps<typeof Stack> {
  isLive: boolean;
  onLiveClick: VoidFunction;
  onZoomInClick: VoidFunction;
  onZoomOutClick: VoidFunction;
}

export function RightControls({
  isLive,
  onLiveClick,
  onZoomInClick,
  onZoomOutClick,
  ...stackProps
}: RightControlsProps) {
  return (
    <Stack direction="column" gap={1.0} {...stackProps}>
      <LiveButton isLive={isLive} onClick={onLiveClick} />
      <Stack
        direction="row"
        gap={1}
        alignItems="center"
        justifyContent="space-between"
      >
        <ZoomOutIcon
          fontSize="large"
          sx={{ cursor: "pointer" }}
          onClick={onZoomOutClick}
        />
        <ZoomInIcon
          fontSize="large"
          sx={{ cursor: "pointer" }}
          onClick={onZoomInClick}
        />
      </Stack>
    </Stack>
  );
}
