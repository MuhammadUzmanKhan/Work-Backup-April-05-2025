import { Divider, Stack, Typography } from "@mui/material";
import { ProjectDetailCardHeader } from "../components/ProjectDetailCardHeader";

export function ProjectDetailsPage() {
  return (
    <Stack px={2}>
      <ProjectDetailCardHeader />
      <Typography variant="body1" p={2} color="common.white">
        OnTrack Event Management System
      </Typography>
      <Divider sx={{ width: "100%" }} />
    </Stack>
  );
}
