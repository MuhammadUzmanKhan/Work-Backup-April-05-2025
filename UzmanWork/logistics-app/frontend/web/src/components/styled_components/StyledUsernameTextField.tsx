import { TextField } from "@mui/material";

export function StyledUsernameTextField(
  props: Parameters<typeof TextField>[0]
) {
  return (
    <TextField
      label="username"
      variant="standard"
      autoComplete="off"
      {...props}
    />
  );
}
