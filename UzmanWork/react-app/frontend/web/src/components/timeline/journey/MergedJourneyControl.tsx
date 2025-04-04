import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { IndeterminateCheckBoxOutlined as IndeterminateCheckBoxOutlinedIcon } from "@mui/icons-material";
import { SwitchIcon } from "icons/switch-icon";
import { JourneyMode } from "pages/JourneyPage";

interface MergedJourneyControlProps {
  totalSelectedClips: number;
  setJourneyMode: React.Dispatch<React.SetStateAction<JourneyMode>>;
  handleUnselect: VoidFunction;
}

export default function MergedJourneyControl({
  totalSelectedClips,
  setJourneyMode,
  handleUnselect,
}: MergedJourneyControlProps) {
  return (
    <Stack
      flexDirection="row"
      alignItems="center"
      gap={3}
      justifyContent="space-between"
    >
      <Box
        display="flex"
        gap={0.7}
        alignItems="center"
        onClick={handleUnselect}
      >
        <IndeterminateCheckBoxOutlinedIcon
          sx={{ color: "#8E96A3", fontSize: "medium" }}
        />
        <Typography
          variant="body1"
          sx={{ color: "neutral.1000" }}
        >{`${totalSelectedClips} Clips Selected`}</Typography>
      </Box>
      <Button
        variant="outlined"
        sx={{
          py: "4px",
          px: "12.5px",
          color: "text.primary",
          borderColor: "text.primary",
          borderRadius: "4px",
        }}
        disabled={totalSelectedClips === 0}
        onClick={() => setJourneyMode(JourneyMode.Filtered)}
      >
        <SwitchIcon
          color={totalSelectedClips === 0 ? "#37415142" : "#000000"}
        />
        <Typography variant="body2" pl={0.3}>
          Create Journey
        </Typography>
      </Button>
    </Stack>
  );
}
