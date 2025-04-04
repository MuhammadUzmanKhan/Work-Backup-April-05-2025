import { Stack, Typography, Button } from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  ReplayRounded as ReplayRoundedIcon,
} from "@mui/icons-material";
import { JourneyMode } from "pages/JourneyPage";

interface MergedJourneyFilterProps {
  setOpenAutoPlayer: (event: boolean) => void;
  setJourneyMode: React.Dispatch<React.SetStateAction<JourneyMode>>;
}

export default function MergedJourneyFilter({
  setOpenAutoPlayer,
  setJourneyMode,
}: MergedJourneyFilterProps) {
  return (
    <Stack flexDirection="row" alignItems="center" gap={2}>
      <Typography variant="h3">Merged Journey</Typography>
      <Button
        variant="contained"
        color="secondary"
        sx={{
          borderRadius: "4px",
          py: "5px",
          gap: "2.5px",
        }}
        onClick={() => setOpenAutoPlayer(true)}
      >
        <PlayArrowIcon fontSize="small" /> Play
      </Button>
      <Button
        variant="outlined"
        sx={{
          color: "common.black",
          borderColor: "common.black",
          borderRadius: "4px",
          py: "5px",
          gap: "2.5px",
        }}
        onClick={() => setJourneyMode(JourneyMode.Initial)}
      >
        <ReplayRoundedIcon fontSize="small" />
        Reset
      </Button>
    </Stack>
  );
}
