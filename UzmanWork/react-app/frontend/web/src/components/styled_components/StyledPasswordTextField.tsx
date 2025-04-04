import { TextField } from "@mui/material";

export function StyledPasswordTextField(
  props: Parameters<typeof TextField>[0]
) {
  return (
    <TextField label="password" variant="standard" type="text" {...props} />
  );
}
