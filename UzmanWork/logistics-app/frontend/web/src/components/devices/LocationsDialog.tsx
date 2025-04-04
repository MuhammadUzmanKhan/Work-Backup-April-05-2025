import { Button, Typography } from "@mui/material";
import { TextFieldValidated } from "components/TextFieldValidated";
import { StyledDialog } from "components/styled_components/StyledDialog";
import { useState } from "react";

// Regex for at least one non-whitespace character
export const NONEMPTY_STRING_REGEX = /^(?!\s*$).+/;
// Regex for at least five non-whitespace characters
export const AT_LEAST_FIVE_CHARACTERS_STRING_REGEX = /^(?:\s*\S\s*?){5,}$/;

interface LocationRegistrationDialogProps {
  open: boolean;
  title: string;
  initialName: string;
  initialAddress: string;
  existingNames: string[];
  onSave: (newName: string, newAddress: string) => Promise<void>;
  onClose: () => void;
}

export function LocationRegistrationDialog({
  open,
  title,
  initialName,
  initialAddress,
  existingNames,
  onSave,
  onClose,
}: LocationRegistrationDialogProps) {
  const [localName, setLocalName] = useState<string>(initialName);
  const [localAddress, setLocalAddress] = useState<string>(initialAddress);
  const [nameError, setNameError] = useState<boolean>(true);
  const [addressError, setAddressError] = useState<boolean>(true);
  const isDuplicatedName = (name: string) =>
    name !== initialName && existingNames.includes(name);
  const enabledSave = !nameError && !addressError && localName && localAddress;

  return (
    <StyledDialog
      fullWidth
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          maxWidth: "27.5rem",
          p: "1.875rem",
          gap: "12px",
          minHeight: "272px",
          justifyContent: "space-between",
        },
      }}
    >
      <Typography
        variant="h3"
        sx={{ display: "flex", justifyContent: "center", textAlign: "center" }}
      >
        {title}
      </Typography>
      <TextFieldValidated
        fullWidth
        autoFocus
        margin="dense"
        variant="outlined"
        placeholder="Enter Location Name"
        value={localName}
        onChange={(e) => setLocalName(e.target.value)}
        setError={setNameError}
        validator={(name) =>
          !isDuplicatedName(name) && NONEMPTY_STRING_REGEX.test(name)
        }
        sx={{
          m: 0,
          input: {
            paddingY: "0.7rem",
            fontSize: "12px",
          },
        }}
        helperText={
          isDuplicatedName(localName)
            ? "Location name already exists"
            : "Location name cannot be empty."
        }
        FormHelperTextProps={{ sx: { ml: 0 } }}
      />
      <TextFieldValidated
        fullWidth
        autoFocus
        margin="dense"
        variant="outlined"
        placeholder="Enter Location Address"
        value={localAddress}
        onChange={(e) => setLocalAddress(e.target.value)}
        setError={setAddressError}
        sx={{
          m: 0,
          input: {
            paddingY: "0.7rem",
            fontSize: "12px",
          },
        }}
        validator={(address) =>
          AT_LEAST_FIVE_CHARACTERS_STRING_REGEX.test(address)
        }
        helperText="Location address must be at least 5 characters."
        FormHelperTextProps={{ sx: { ml: 0 } }}
      />
      <Button
        variant="contained"
        color="secondary"
        disabled={!enabledSave}
        onClick={() => {
          onSave(localName, localAddress);
          onClose();
        }}
        sx={{ px: "9.5px", borderRadius: "4px" }}
      >
        Save
      </Button>
    </StyledDialog>
  );
}
