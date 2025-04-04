import { Menu, MenuItem, Typography } from "@mui/material";
import { Organization } from "coram-common-utils";

interface OrganizationSelectorMobileProps {
  open: boolean;
  menuRef: HTMLDivElement | null;
  organizations: Map<number, Organization>;
  onClose: () => void;
  onChange: (org: Organization) => void;
}

export function OrganizationSelectorMobile({
  open,
  menuRef,
  organizations,
  onClose,
  onChange,
}: OrganizationSelectorMobileProps) {
  return (
    <Menu
      open={open}
      anchorEl={menuRef}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      transitionDuration={0}
      onClose={onClose}
    >
      {[...organizations.values()].map((organization: Organization) => (
        <MenuItem key={organization.id} onClick={() => onChange(organization)}>
          <Typography variant="body2">{organization.name}</Typography>
        </MenuItem>
      ))}
    </Menu>
  );
}
