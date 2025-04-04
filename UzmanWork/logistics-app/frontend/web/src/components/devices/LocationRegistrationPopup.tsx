import {
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DevicesService, LocationCreate } from "coram-common-utils";
import React, { Dispatch, SetStateAction, useContext, useState } from "react";
import { ChevronLeft as ChevronLeftIcon } from "@mui/icons-material";
import { PopupContainer } from "./DeviceRegistrationPopup";
import { TextFieldValidated } from "components/TextFieldValidated";
import { AT_LEAST_FIVE_CHARACTERS_STRING_REGEX } from "./LocationsDialog";
import { NotificationContext } from "contexts/notification_context";

interface LocationRegistrationPopupProps {
  deviceCode: string;
  setLocationOpen: Dispatch<SetStateAction<boolean>>;
  refetchLocations: () => void;
  setLocationUpstream: Dispatch<SetStateAction<number | undefined>>;
}

export const LocationRegistrationPopup = ({
  deviceCode,
  setLocationOpen,
  refetchLocations,
  setLocationUpstream,
}: LocationRegistrationPopupProps) => {
  const { setNotificationData } = useContext(NotificationContext);

  // Location to save
  const [location, setLocation] = React.useState<LocationCreate>({
    name: "",
    address: "",
    address_lat: 0,
    address_lon: 0,
  });

  const [addressError, setAddressError] = useState<boolean>(true);
  const enabledSave = !addressError && location.name && location.address;
  // TODO(@lberg): should not be here but in a component
  const contents = (
    <PopupContainer spacing={4} paddingY="3.3rem">
      <Stack direction="row">
        <Typography
          sx={{
            display: "flex",
            fontWeight: "bold",
            cursor: "pointer",
          }}
          onClick={() => setLocationOpen(false)}
        >
          <ChevronLeftIcon />
          Back
        </Typography>
        <Typography variant="h2" textAlign="center" flexGrow={1} pr={6}>
          Add Location
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography
          variant="body1"
          sx={{
            fontSize: "14px",
            backgroundColor: "#3741511f",
            border: "1px solid #3741511f",
            borderRadius: "4px",
            padding: "0.7rem 0.4rem",
          }}
        >
          {deviceCode}
        </Typography>
        <TextField
          value={location.name}
          variant="outlined"
          placeholder="Location Name"
          inputProps={{ maxLength: 20 }}
          onChange={(event) =>
            setLocation((oldLocation) => ({
              ...oldLocation,
              name: event.target.value,
            }))
          }
          sx={{
            input: {
              paddingY: "0.7rem",
              fontSize: "14px",
            },
          }}
        />
        <TextFieldValidated
          value={location?.address}
          variant="outlined"
          placeholder="Location Address"
          onChange={(event) =>
            setLocation((oldLocation) => ({
              ...oldLocation,
              address: event.target.value,
            }))
          }
          sx={{
            my: "1.2rem",
            input: {
              paddingY: "0.7rem",
              fontSize: "14px",
            },
          }}
          setError={setAddressError}
          validator={(address) =>
            AT_LEAST_FIVE_CHARACTERS_STRING_REGEX.test(address)
          }
          helperText="Location address must be at least 5 characters."
          FormHelperTextProps={{ sx: { ml: 0 } }}
        />

        <Button
          color="secondary"
          variant="contained"
          disabled={!enabledSave}
          sx={{
            borderRadius: "4px",
          }}
          onClick={async () => {
            try {
              const res = await DevicesService.createLocation(location);
              if (res > 0) {
                await refetchLocations();
                setLocationUpstream(res);
                setLocationOpen(false);
              }
            } catch (error) {
              console.error(`Failed to create a location due to ${error}`);
              setNotificationData({
                message: "Failed to create location. Please try again.",
                severity: "error",
              });
            }
          }}
        >
          Submit
        </Button>
      </Stack>
    </PopupContainer>
  );
  return (
    <Container component={Paper} elevation={12}>
      {contents}
    </Container>
  );
};
