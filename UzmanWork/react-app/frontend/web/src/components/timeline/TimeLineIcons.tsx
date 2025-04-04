import { Box, Tooltip } from "@mui/material";
import {
  PersonOutline as PersonOutlineOutlinedIcon,
  DirectionsCarOutlined as DirectionsCarOutlinedIcon,
  AnimationOutlined as AnimationOutlinedIcon,
} from "@mui/icons-material";

import { DetectionAggregatedColors } from "theme/consts";

export function TimeLineIcons() {
  return (
    <Box
      sx={{
        // height: "25px",
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "center",
        rowGap: "0.6rem",
      }}
    >
      <Tooltip title="Person" placement="left">
        <PersonOutlineOutlinedIcon
          style={{
            color: "#fff",
            backgroundColor: DetectionAggregatedColors.PERSON,
            borderRadius: "25px",
            fontSize: "18px",
            padding: "2px",
          }}
        />
      </Tooltip>
      <Tooltip title="Car" placement="left">
        <DirectionsCarOutlinedIcon
          style={{
            color: "#fff",
            backgroundColor: DetectionAggregatedColors.VEHICLE,
            borderRadius: "25px",
            fontSize: "18px",
            padding: "2px",
          }}
        />
      </Tooltip>
      <Tooltip title="Motion" placement="left">
        <AnimationOutlinedIcon
          style={{
            color: "#fff",
            backgroundColor: DetectionAggregatedColors.MOTION,
            borderRadius: "25px",
            fontSize: "18px",
            padding: "2px",
          }}
        />
      </Tooltip>
    </Box>
  );
}
