import { Chip, Stack, Typography } from "@mui/material";
import { MoreVert as MoreVertIcon } from "@mui/icons-material";
interface WallChipProps {
  name: string;
}

export default function WallChip({ name = "New Wall" }: WallChipProps) {
  return (
    <Chip
      sx={{ cursor: "pointer" }}
      variant={"filled"}
      label={
        <Stack
          direction="row"
          sx={{
            minWidth: "2rem",
            maxWidth: "fit-content",
            alignItems: "center",
          }}
        >
          <Typography variant="body2">{name}</Typography>
          <MoreVertIcon sx={{ fontSize: "1rem" }} />
        </Stack>
      }
    />
  );
}
