import { MenuItem } from "@mui/material";
import { UserWallsResponse } from "coram-common-utils";
import { StyledSelect } from "components/styled_components/StyledSelect";

interface WallsSelectorMobileProps {
  userWalls: UserWallsResponse;
  currentWallId: number | null;
  updateWallId: (wallId: number) => void;
}

export function WallSelectorMobile({
  userWalls,
  currentWallId,
  updateWallId,
}: WallsSelectorMobileProps) {
  return (
    <StyledSelect
      value={currentWallId}
      onChange={(event) => updateWallId(event.target.value as number)}
      fullWidth
      sx={{
        p: 0.5,
      }}
    >
      {userWalls.walls.map((wall) => (
        <MenuItem key={wall.wall.id} value={wall.wall.id}>
          {wall.wall.name}
        </MenuItem>
      ))}
    </StyledSelect>
  );
}
