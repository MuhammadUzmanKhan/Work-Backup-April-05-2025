import { Typography, Stack, MenuItem } from "@mui/material";
import { PanelSectionHeader } from "./PanelSectionHeader";
import { StyledSelect } from "components/styled_components/StyledSelect";
import Grid from "@mui/material/Unstable_Grid2";
import { TextFieldValidated } from "components/TextFieldValidated";
import { useState } from "react";

export type AllowedExpirationDurations = "hours" | "days" | "weeks";
export interface ExpirationDurState {
  unit: AllowedExpirationDurations;
  value: number;
}
export interface PanelOptionPickerProps {
  title: string;
  options: AllowedExpirationDurations[];
  expirationDur: ExpirationDurState;
  setExpirationDur: React.Dispatch<React.SetStateAction<ExpirationDurState>>;
}

const NUM_REGEX = /^[1-9]\d*$/;

export function CustomDurationPicker({
  title,
  options,
  expirationDur,
  setExpirationDur,
}: PanelOptionPickerProps) {
  const [error, setError] = useState(false);
  return (
    <Stack gap={0.5} minHeight="4.7rem">
      <PanelSectionHeader title={title} color="text.secondary" />
      <Grid
        container
        border="1px solid #ccc"
        sx={{
          maxWidth: "9.0625rem",
          height: "2.25rem",
          alignItems: "center",
          border: error ? "1px solid red " : "1px solid #ccc",
        }}
      >
        <Grid xs={5}>
          <TextFieldValidated
            validator={(value) => NUM_REGEX.test(value)}
            variant="outlined"
            size="small"
            sx={{
              "& .MuiOutlinedInput-notchedOutline": {
                border: "0",
                outline: "none",
                boxShadow: "none",
              },
              input: { textAlign: "center" },
            }}
            setError={setError}
            defaultValue={1}
            onChange={(event) => {
              setExpirationDur((prevState: ExpirationDurState) => ({
                ...prevState,
                value: parseInt(event.target.value, 10),
              }));
            }}
          />
        </Grid>
        <Grid xs={7} borderLeft="1px solid #ccc">
          <StyledSelect
            displayEmpty
            value={expirationDur.unit}
            sx={{
              borderRadius: 0,
              ".MuiOutlinedInput-notchedOutline": {
                border: 0,
              },
            }}
            fullWidth
            onChange={(event) => {
              setExpirationDur((prevState: ExpirationDurState) => ({
                ...prevState,
                unit: event.target.value as AllowedExpirationDurations,
              }));
            }}
          >
            {options.map((option, idx) => (
              <MenuItem key={idx} value={option}>
                <Typography
                  variant="body2"
                  sx={{
                    textTransform: "capitalize",
                  }}
                >
                  {option}
                </Typography>
              </MenuItem>
            ))}
          </StyledSelect>
        </Grid>
      </Grid>
      {error && (
        <Typography variant="body3" color="red">
          Enter valid non zero Number
        </Typography>
      )}
    </Stack>
  );
}
