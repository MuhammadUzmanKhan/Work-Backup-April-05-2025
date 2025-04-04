import {
  styled,
  ToggleButton,
  toggleButtonClasses,
  ToggleButtonGroup,
  toggleButtonGroupClasses,
  Tooltip,
} from "@mui/material";
import { LineCrossingDirection } from "coram-common-utils";
import { BothDirectionIcon } from "./BothDirectionIcon";
import { LeftDirectionIcon } from "./LeftDirectionIcon";
import { RightDirectionIcon } from "./RightDirectionIcon";

interface LineCrossingDirectionSelectorProps {
  lineCrossingDirection: LineCrossingDirection;
  setLineCrossingDirection: (
    lineCrossingDirection: LineCrossingDirection
  ) => void;
}

export function LineCrossingDirectionSelector({
  lineCrossingDirection,
  setLineCrossingDirection,
}: LineCrossingDirectionSelectorProps) {
  return (
    <StyledToggleButtonGroup
      size="small"
      value={lineCrossingDirection}
      exclusive
      onChange={(_, value) => {
        if (value === null) {
          return;
        }
        setLineCrossingDirection(value);
      }}
    >
      <StyledToggleButton value={LineCrossingDirection.BOTH}>
        <Tooltip title="Count line crossing in both directions">
          <BothDirectionIcon
            selected={lineCrossingDirection === LineCrossingDirection.BOTH}
          />
        </Tooltip>
      </StyledToggleButton>
      <StyledToggleButton value={LineCrossingDirection.LEFT}>
        <Tooltip title="Count line crossing in left directions">
          <LeftDirectionIcon
            selected={lineCrossingDirection === LineCrossingDirection.LEFT}
          />
        </Tooltip>
      </StyledToggleButton>
      <StyledToggleButton value={LineCrossingDirection.RIGHT}>
        <Tooltip title="Count line crossing in right directions">
          <RightDirectionIcon
            selected={lineCrossingDirection === LineCrossingDirection.RIGHT}
          />
        </Tooltip>
      </StyledToggleButton>
    </StyledToggleButtonGroup>
  );
}

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(() => ({
  [`&.${toggleButtonGroupClasses.root}`]: {
    backgroundColor: "transparent",
    border: 0,
  },
}));

const StyledToggleButton = styled(ToggleButton)(() => ({
  [`&.${toggleButtonClasses.root}`]: {
    backgroundColor: "transparent",
    border: 0,
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  [`&.${toggleButtonClasses.selected}`]: {
    backgroundColor: "transparent",
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
}));
