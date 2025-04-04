import { Button, Stack, TextField, Typography } from "@mui/material";

type CredentialUpdaterFieldProps = {
  name: string;
  hasValue: boolean;
  onButtonClick: (val: boolean) => void;
  textFieldProps: Parameters<typeof TextField>[0];
};

export function CredentialUpdaterField({
  name,
  hasValue,
  onButtonClick,
  textFieldProps,
}: CredentialUpdaterFieldProps) {
  return (
    <Stack>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {name}
      </Typography>
      <Stack direction="row" gap={1}>
        <TextField
          disabled={hasValue}
          variant="outlined"
          placeholder={name}
          fullWidth
          sx={{
            input: {
              paddingY: "0.4rem",
            },
          }}
          {...textFieldProps}
        />
        <Button
          variant="outlined"
          color="info"
          size="small"
          onClick={() => onButtonClick(!hasValue)}
          sx={{
            minWidth: "5.6rem",
            borderRadius: "4px",
            paddingY: 0,
          }}
        >
          {hasValue ? "Reset" : "Set"}
        </Button>
      </Stack>
    </Stack>
  );
}
