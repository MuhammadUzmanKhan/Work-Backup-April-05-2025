import { VideoResRequestType } from "coram-common-utils";
import { ActionButton } from "components/styled_components/ActionButton";
import { Tooltip } from "@mui/material";
import { HdIcon } from "icons/hd-icon";

interface HDControlIconButtonProps {
  onClick: (resolution: VideoResRequestType) => void;
  resolution: VideoResRequestType;
}

export function HDControlIconButton({
  onClick,
  resolution,
}: HDControlIconButtonProps) {
  const isHD = resolution === VideoResRequestType.HIGH;
  return (
    <Tooltip title="Quality" placement="bottom">
      <ActionButton
        onClick={() =>
          onClick(isHD ? VideoResRequestType.LOW : VideoResRequestType.HIGH)
        }
      >
        <HdIcon color={isHD ? "#10B981" : "#ffff"} />
      </ActionButton>
    </Tooltip>
  );
}
