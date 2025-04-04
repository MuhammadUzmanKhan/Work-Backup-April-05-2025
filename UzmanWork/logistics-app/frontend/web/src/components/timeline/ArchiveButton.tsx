import { Box, Tooltip, Typography } from "@mui/material";
import { StorageOutlined as StorageOutlinedIcon } from "@mui/icons-material";

interface ArchiveButtonProps {
  onClick: () => void;
  iconColor?: string;
}

export function ArchiveButton({ onClick, iconColor }: ArchiveButtonProps) {
  return (
    <Box alignItems="center" display="flex" onClick={onClick}>
      <Tooltip title={"Archive event"}>
        <StorageOutlinedIcon
          fontSize="large"
          sx={{
            color: iconColor,
            padding: "0.4rem",
            cursor: "pointer",
          }}
        />
      </Tooltip>
      <Typography variant="body2">Archive</Typography>
    </Box>
  );
}
