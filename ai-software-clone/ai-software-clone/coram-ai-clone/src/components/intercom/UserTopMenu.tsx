import { ArrowDropDown as ArrowDropDownIcon } from "@mui/icons-material";
import { Button, Menu, MenuItem } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";

export function UserTopMenu() {
  const [open, setOpen] = React.useState(false);
  const anchorEl = React.useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  return (
    <>
      <Button
        ref={anchorEl}
        sx={{ minWidth: "auto", p: 0, mb: "0.5rem" }}
        id="logout-button"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={() => setOpen(true)}
      >
        <ArrowDropDownIcon
          sx={{ color: "neutral.1000", mt: "0.5rem" }}
          fontSize="large"
        />
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl.current}
        open={open}
        onClose={() => setOpen(false)}
        MenuListProps={{
          "aria-labelledby": "logout-button",
        }}
        PaperProps={{
          style: {
            width: 250,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
          sx={{ color: "neutral.1000" }}
        >
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
