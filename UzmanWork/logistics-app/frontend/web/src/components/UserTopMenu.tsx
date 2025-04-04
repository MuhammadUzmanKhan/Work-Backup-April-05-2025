import { ArrowDropDown as ArrowDropDownIcon } from "@mui/icons-material";
import { Button, Menu, MenuItem } from "@mui/material";
import React from "react";
import { Link } from "react-router-dom";
import { DesktopOnly } from "./layout/DesktopOnly";
import { useLogout } from "hooks/logout";

export function UserTopMenu() {
  const [open, setOpen] = React.useState(false);
  const anchorEl = React.useRef<HTMLButtonElement>(null);
  const { logoutHandler } = useLogout();

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
        <DesktopOnly>
          <Link style={{ textDecoration: "none" }} to="/settings">
            <MenuItem sx={{ color: "neutral.1000" }}>Settings</MenuItem>
          </Link>
        </DesktopOnly>

        <Link
          style={{ textDecoration: "none" }}
          to="https://help.coram.ai"
          target="_blank"
        >
          <MenuItem sx={{ color: "neutral.1000" }}>Documentation</MenuItem>
        </Link>
        <MenuItem
          onClick={async () => await logoutHandler()}
          sx={{ color: "neutral.1000" }}
        >
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
