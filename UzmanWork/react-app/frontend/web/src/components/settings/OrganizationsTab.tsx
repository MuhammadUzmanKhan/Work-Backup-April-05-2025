import {
  Button,
  DialogContent,
  Menu,
  MenuItem,
  Modal,
  Stack,
  Typography,
} from "@mui/material";
import { Organization, useSelectedOrganization } from "coram-common-utils";
import { SelectorIcon } from "components/devias/selector";
import { AbsolutelyCentered } from "components/AbsolutelyCentered";
import React, { useMemo, useState } from "react";

import OrgAddPopUp from "components/settings/OrgAddPopUp";
import {
  getOrganizationIdInStorage,
  setOrganizationIdInStorage,
} from "utils/local_storage";

export function OrganizationsTab() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [registrationOpen, setRegistrationOpen] = useState<boolean>(false);
  const {
    organization,
    setOrganization,
    organizations: organizationsMap,
  } = useSelectedOrganization({
    setOrganizationIdInStorage,
    getOrganizationIdInStorage,
  });

  const organizations = useMemo(
    () =>
      [...organizationsMap.values()].toSorted((a, b) =>
        a.name.localeCompare(b.name)
      ),
    [organizationsMap]
  );

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleChange = (org: Organization): void => {
    setOrganization(org);
    setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if (registrationOpen) {
    return (
      <Modal open={registrationOpen} onClose={() => setRegistrationOpen(false)}>
        <DialogContent>
          <AbsolutelyCentered>
            <OrgAddPopUp setRegistrationOpen={setRegistrationOpen} />
          </AbsolutelyCentered>
        </DialogContent>
      </Modal>
    );
  }

  return (
    <Stack padding={3}>
      <Button
        onClick={() => setRegistrationOpen(true)}
        color="secondary"
        variant="contained"
        sx={{ marginLeft: "auto", alignSelf: "center" }}
      >
        Add New Organization
      </Button>
      <Typography variant="h2" sx={{ mb: "1rem" }}>
        Organizations
      </Typography>
      <Button
        onClick={handleClick}
        sx={{
          backgroundColor: "neutral.200",
          color: "common.black",
          display: "flex",
          justifyContent: "space-between",
          "&:hover": { backgroundColor: "neutral.300" },
        }}
      >
        <Typography color="inherit" variant="body2">
          {organization?.name ?? "Select Organization"}{" "}
        </Typography>
        <SelectorIcon
          sx={{
            color: "neutral.500",
            width: 14,
            height: 14,
          }}
        />
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        sx={{
          "& .MuiPaper-root": {
            width: "24rem",
          },
        }}
      >
        {organizations.map((organization: Organization) => (
          <MenuItem
            key={organization.id}
            onClick={() => handleChange(organization)}
          >
            {organization.name}
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  );
}
