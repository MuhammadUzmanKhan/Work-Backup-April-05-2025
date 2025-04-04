import { Box, Typography } from "@mui/material";
import { FaceRenderer } from "./FaceRenderer";
import { Face } from "../types/faces";

interface FaceGridProps {
  faces: Array<Face>;
  onClick: (face: Face) => void;
  noFacesMessage: string;
}

export function FaceGrid({ faces, onClick, noFacesMessage }: FaceGridProps) {
  return (
    <Box display="grid" gridTemplateColumns="repeat(auto-fill,150px)" gap={2}>
      {faces.length === 0 ? (
        <Typography
          sx={{ color: "neutral.1000", fontSize: "14px", fontWeight: "600" }}
        >
          {noFacesMessage}
        </Typography>
      ) : (
        faces.map((face) => (
          <FaceRenderer key={face.id} face={face} onClick={onClick} />
        ))
      )}
    </Box>
  );
}
