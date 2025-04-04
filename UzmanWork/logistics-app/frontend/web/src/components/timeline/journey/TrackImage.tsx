import { Stack } from "@mui/material";

interface TrackImageProps {
  imageUrl: string;
  width?: number;
  height?: number;
  onClick?: () => void;
}

export function TrackImage({
  imageUrl,
  width = 150,
  height = 150,
  onClick,
}: TrackImageProps) {
  return (
    <Stack
      width={width}
      height={height}
      justifyContent="center"
      alignItems="center"
      position="relative"
      sx={{
        backgroundColor: "black",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <img
        src={imageUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          verticalAlign: "middle",
        }}
      ></img>
    </Stack>
  );
}
