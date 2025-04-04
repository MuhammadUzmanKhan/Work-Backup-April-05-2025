import { Divider, Stack, Typography } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

export function ProjectDetailCardHeader() {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="start"
      sx={{
        backgroundColor: "#C6D57E",
        color: "#1B1B1B",
        borderRadius: "4px",
      }}
    >
      <Stack direction="row" color="#1B1B1B" p={1}>
        <Typography variant="body1" p={2}>
          Project Details
        </Typography>
        <Divider orientation="vertical" />
        <Typography variant="body2" p={2}>
          Start Time:05/23/2023
        </Typography>
        <Divider orientation="vertical" />
        <Typography variant="body2" p={2}>
          End Date:07/23/2023
        </Typography>
      </Stack>
      <CloseIcon fontSize="small" />
    </Stack>
  );
}
