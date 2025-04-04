import { IconButton, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import { useRef, useState } from "react";

interface VideoSpeedControlProps {
  playbackRate?: number;
  onPlayBackRateClick: (speed: number) => void;
  isActive?: boolean;
  isFullScreen?: boolean;
  color?: string;
  variant: "small" | "large";
  tooltip?: string;
}

const PLAYBACK_RATES_OPTIONS = [0.5, 1, 2, 4];

export function VideoSpeedControl({
  playbackRate = 1,
  onPlayBackRateClick,
  isActive = true,
  isFullScreen = false,
  color = "common.white",
  variant = "small",
  tooltip,
}: VideoSpeedControlProps) {
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title={tooltip} placement="bottom">
        <IconButton
          disabled={!isActive}
          ref={anchorRef}
          onClick={() => setOpen(true)}
          sx={{
            minWidth: variant === "small" ? "1.875rem" : undefined,
            maxHeight: variant == "small" ? "1rem" : undefined,
            borderRadius: "0.3rem",
            borderColor: color,
            borderStyle: "dashed",
            borderWidth: variant === "small" ? "1px" : "2px",
            color: color,
            px: variant === "small" ? "3px" : "10px",
            py: variant === "small" ? "3px" : "5px",
          }}
        >
          <Typography variant={variant === "small" ? "body3" : "body1"}>
            {playbackRate}x
          </Typography>
        </IconButton>
      </Tooltip>

      {isActive && (
        <Menu
          open={open}
          anchorEl={anchorRef.current}
          container={isFullScreen ? anchorRef.current : null}
          onClose={() => setOpen(false)}
          anchorOrigin={{
            vertical: -4,
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
        >
          {PLAYBACK_RATES_OPTIONS.map((speed) => (
            <MenuItem
              key={speed}
              disableGutters
              sx={{ p: 0.5, justifyContent: "center" }}
            >
              <Typography
                variant="body1"
                onClick={() => {
                  onPlayBackRateClick(speed);
                  setOpen(false);
                }}
              >
                {speed}x
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
}
