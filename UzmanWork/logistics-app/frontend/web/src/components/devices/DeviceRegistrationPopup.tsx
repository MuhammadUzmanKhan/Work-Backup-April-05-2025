import {
  Add as AddIcon,
  InfoOutlined as InfoOutlinedIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  styled,
} from "@mui/material";
import { DevicesService, useLocations } from "coram-common-utils";
import { AbsolutelyCentered } from "components/AbsolutelyCentered";
import { LocationRegistrationPopup } from "components/devices/LocationRegistrationPopup";
import { useIsAdmin } from "components/layout/RoleGuards";
import { NotificationContext } from "contexts/notification_context";
import React, { Dispatch, SetStateAction, useContext } from "react";

enum Stage {
  Initial = 0,
  IncorrectCode = 1,
  CodeValidated = 2,
  SaveInitiated = 3,
  Error = 4,
}
export const PopupContainer = styled(Stack)(() => ({
  minWidth: "28rem",
  minHeight: "20.5rem",
  justifyContent: "center",
}));

interface DeviceRegistrationPopupProps {
  setRegistrationOpen: Dispatch<SetStateAction<boolean>>;
  onRegistrationSuccess: VoidFunction;
}

export const DeviceRegistrationPopup = ({
  setRegistrationOpen,
  onRegistrationSuccess,
}: DeviceRegistrationPopupProps) => {
  const [locationOpen, setLocationOpen] = React.useState<boolean>(false);
  const [stage, setStage] = React.useState<Stage>(Stage.Initial);
  const [code, setCode] = React.useState<string>("");
  const [validatedCode, setValidatedCode] = React.useState<string>("");
  const [locationId, setLocationId] = React.useState<number | undefined>(
    undefined
  );
  const [updateError, setUpdateError] = React.useState<string>("");

  const { data: locations, refetch: refetchLocations } = useLocations();

  const isAdmin = useIsAdmin();

  const submitDisabled = code.length === 0 || !isAdmin;
  const { setNotificationData } = useContext(NotificationContext);

  const codePromptContents = (
    <PopupContainer
      sx={{
        minHeight: "12rem",
        minWidth: "26rem",
      }}
      spacing={1.5}
    >
      <Stack spacing={0.5} pb={2}>
        <Typography variant="h2" textAlign="center">
          Enter Appliance Code
        </Typography>
        <Stack
          alignItems="center"
          sx={{
            color: "#83889E",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <InfoOutlinedIcon fontSize="small" sx={{ mr: "0.3rem" }} />
            Appliance code is printed on the Coram Point
          </Typography>
          <Typography variant="body2">
            All characters are in lower case.
          </Typography>
        </Stack>
      </Stack>
      <Stack spacing={2}>
        <TextField
          value={code}
          variant="outlined"
          placeholder="Enter Appliance Code."
          onChange={(event) => setCode(event.target.value.toLocaleLowerCase())}
          sx={{
            input: {
              paddingY: "0.7rem",
            },
          }}
        />
        {stage == Stage.IncorrectCode && (
          <Typography color="error" variant="body2">
            Incorrect code
          </Typography>
        )}
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
              const res = await DevicesService.validateNvrCode(code.trim());
              if (!res) {
                setStage(Stage.IncorrectCode);
              } else {
                setValidatedCode(code);
                setStage(Stage.CodeValidated);
              }
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
  const validatedContents = (
    <>
      <PopupContainer spacing={2.5}>
        <Typography variant="h2" textAlign="center">
          Add Location
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: "14px",
            backgroundColor: "#3741511f",
            border: "1px solid #3741511f",
            borderRadius: "4px",
            padding: "0.7rem 0.4rem",
            color: "#cccc",
          }}
        >
          {code}
        </Typography>
        <FormControl>
          <InputLabel>Choose Location</InputLabel>
          <Select
            label="Choose Location"
            value={locationId ?? ""}
            onChange={(event) => setLocationId(event.target.value as number)}
          >
            {Array.from(locations?.values() ?? [], (loc) => (
              <MenuItem key={loc.id} value={loc.id}>
                {loc.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          sx={{ justifyContent: "start" }}
          onClick={() => setLocationOpen(true)}
          startIcon={<AddIcon fontSize="small" />}
        >
          Add New Location
        </Button>
        <Button
          color="secondary"
          variant="contained"
          disabled={locationId === undefined}
          sx={{ borderRadius: "4px" }}
          onClick={async () => {
            if (!locationId) return;
            try {
              setStage(() => Stage.SaveInitiated);
              setUpdateError("");
              const res = await DevicesService.registerNvr({
                location_id: locationId,
                uuid: validatedCode,
              });
              if (res) {
                onRegistrationSuccess();
                setUpdateError("Appliance registered successfully.");
                setTimeout(() => setRegistrationOpen(false), 1000);
              }
            } catch (error) {
              setStage(() => Stage.Error);
              setUpdateError("Operation failed. Please try again.");
              console.error(`Failed to create a group due to ${error}`);
            }
          }}
        >
          Submit
        </Button>
        {updateError.length > 0 && (
          <Typography color="error" variant="body2">
            {updateError}
          </Typography>
        )}
      </PopupContainer>
      <Modal open={locationOpen} onClose={() => setLocationOpen(false)}>
        <DialogContent>
          <AbsolutelyCentered>
            <LocationRegistrationPopup
              deviceCode={code}
              setLocationOpen={setLocationOpen}
              refetchLocations={refetchLocations}
              setLocationUpstream={setLocationId}
            />
          </AbsolutelyCentered>
        </DialogContent>
      </Modal>
    </>
  );
  return (
    <Container
      component={Paper}
      elevation={12}
      sx={{
        display: "flex",
        flexDirection: "column",
        outline: "none",
        p: 3,
      }}
    >
      <Box display="flex" alignItems="center" flexWrap="nowrap">
        {stage < Stage.CodeValidated && codePromptContents}
        {stage == Stage.CodeValidated && validatedContents}
        {stage == Stage.Error && validatedContents}
        {stage == Stage.SaveInitiated && <CircularProgress />}
      </Box>
    </Container>
  );
};
