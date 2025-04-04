import styled from "@emotion/styled";
import { Box, Button, Stack, Typography } from "@mui/material";
import { ChevronRightRounded as ChevronRightRoundedIcon } from "@mui/icons-material";

const CircleBackground = styled(Box)(() => ({
  display: "inline-flex",
  borderRadius: "50%",
  border: "1px solid #C3C9D4",
  alignItems: "center",
  backgroundColor: "#C3C9D4",
  color: "#ffff",
}));

function ListItem({ title }: { title: string }) {
  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <CircleBackground>
        <ChevronRightRoundedIcon sx={{ fontSize: "12px" }} />
      </CircleBackground>
      <Typography variant="body2" color="#83889E">
        {title}
      </Typography>
    </Stack>
  );
}

export function NotificationInfo() {
  return (
    <Stack gap={2} minWidth="100%">
      <Typography variant="body2">To create a notification group</Typography>
      <Stack gap={1}>
        <ListItem title={"Go to Settings"} />
        <ListItem title={"Create Notification Group"} />
      </Stack>
      <Button
        variant="contained"
        color="secondary"
        sx={{ borderRadius: "0.25rem" }}
        onClick={() => {
          window.open("/settings?tab=notification", "_blank");
        }}
      >
        Go to Settings
      </Button>
    </Stack>
  );
}
