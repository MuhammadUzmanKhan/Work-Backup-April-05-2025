import { Stack, Typography } from "@mui/material";
import { Face } from "../types/faces";

interface FaceRendererProps {
  face: Face;
  onClick?: (face: Face) => void;
  width?: number;
  height?: number;
}

export function FaceRenderer({
  face,
  width = 150,
  height = 150,
  onClick,
}: FaceRendererProps) {
  return (
    <Stack direction="column" spacing={1} alignItems={"center"}>
      <img
        src={face.s3_signed_url}
        width={width}
        height={height}
        style={{
          objectFit: "contain",
          backgroundColor: "black",
          cursor: "pointer",
        }}
        onClick={() => onClick?.(face)}
      ></img>
      {face.description && <Typography>{face.description}</Typography>}
    </Stack>
  );
}
