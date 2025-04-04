import { Divider, Stack } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { PanelSectionHeader } from "./PanelSectionHeader";

export const PanelHeader = ({
  title,
  onCloseClick,
}: {
  title: string;
  onCloseClick: () => void;
}) => (
  <Stack
    sx={{
      position: "sticky",
      top: "0",
      zIndex: "2",
      backgroundColor: "#ffff",
    }}
  >
    <Stack flexDirection="row" justifyContent="space-between" p={1}>
      <PanelSectionHeader title={title} />
      <CloseIcon
        onClick={() => onCloseClick()}
        sx={{
          cursor: "pointer",
          color: "neutral.1000",
        }}
        fontSize="small"
      />
    </Stack>
    <Divider sx={{ width: "100%" }} />
  </Stack>
);
