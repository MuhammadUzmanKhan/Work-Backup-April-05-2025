import { useState, Dispatch, SetStateAction, useContext } from "react";
import { OrganizationsService } from "coram-common-utils";
import { useIsAdmin } from "components/layout/RoleGuards";
import { NotificationContext } from "contexts/notification_context";
import { PopupContainer } from "components/devices/DeviceRegistrationPopup";
import {
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  Button,
} from "@mui/material";
import { InfoOutlined as InfoOutlinedIcon } from "@mui/icons-material";

interface DeviceRegistrationPopupProps {
  setRegistrationOpen: Dispatch<SetStateAction<boolean>>;
}

export default function OrgAddPopUp({
  setRegistrationOpen,
}: DeviceRegistrationPopupProps) {
  const [orgName, setOrgName] = useState<string>("");
  const { setNotificationData } = useContext(NotificationContext);

  const isAdmin = useIsAdmin();
  const submitDisabled = orgName.length === 0 || !isAdmin;

  const orgNamePromptContents = (
    <PopupContainer
      sx={{
        minHeight: "12rem",
        minWidth: "26rem",
      }}
      spacing={1.5}
    >
      <Stack spacing={0.5} pb={2}>
        <Typography variant="h3" textAlign="center">
          Enter Organization Name
        </Typography>
        <Typography
          sx={{
            display: "flex",
            justifyContent: "center",
            color: "#83889E",
            fontSize: "0.85rem",
          }}
        >
          <InfoOutlinedIcon fontSize="small" sx={{ mr: "0.3rem" }} />
          Organization name is case sensitive
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <TextField
          value={orgName}
          variant="outlined"
          placeholder="Enter Organization Name"
          onChange={(event) => setOrgName(event.target.value)}
          sx={{
            input: {
              paddingY: "0.7rem",
              fontSize: "14px",
            },
          }}
        />
        <Button
          color="secondary"
          variant="contained"
          disabled={submitDisabled}
          sx={{
            borderRadius: "4px",
            py: "0.75rem",
          }}
          onClick={async () => {
            try {
              await OrganizationsService.createOrganization({
                name: orgName,
              });

              setNotificationData({
                message: "Organization created!",
                severity: "success",
              });
              setTimeout(() => setRegistrationOpen(false), 1000);
            } catch (error) {
              setNotificationData({
                message: "Something went wrong. Please try again later!",
                severity: "error",
              });
              console.error(error);
            }
          }}
        >
          Submit
        </Button>
      </Stack>
    </PopupContainer>
  );

  return (
    <Container
      component={Paper}
      elevation={24}
      sx={{
        p: 3,
      }}
    >
      {orgNamePromptContents}
    </Container>
  );
}
