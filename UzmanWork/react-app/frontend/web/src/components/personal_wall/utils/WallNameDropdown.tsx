// WallNameDropdown

import { useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { GeneralWallResponse } from "./utils";

interface WallNameDropdownProps {
  dropdownWalls: GeneralWallResponse[];
  onWallItemClick: (wall: GeneralWallResponse) => void;
}

// Dropdown menu of wall names,
export function WallNameDropdown({
  dropdownWalls,
  onWallItemClick,
}: WallNameDropdownProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        onClick={(ev) => setAnchorEl(ev.currentTarget)}
        sx={{
          color: "neutral.1000",
        }}
      >
        More
        {open ? (
          <ExpandLessIcon
            sx={{
              color: "neutral.400",
            }}
          />
        ) : (
          <ExpandMoreIcon
            sx={{
              color: "neutral.400",
            }}
          />
        )}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {dropdownWalls.map((wall, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              setAnchorEl(null);
              onWallItemClick(wall);
            }}
          >
            {wall.wall.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
