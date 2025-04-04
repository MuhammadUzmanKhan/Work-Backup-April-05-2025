import type { TextFieldProps } from "@mui/material";
import { TextField } from "@mui/material";

interface MessageFieldProps {
  userMessage: string;
  setUserMessage: (message: string) => void;
}

export function MessageField({
  userMessage,
  setUserMessage,
  ...props
}: TextFieldProps & MessageFieldProps) {
  return (
    <TextField
      {...props}
      fullWidth
      margin="dense"
      label="Optional Message"
      value={userMessage}
      onChange={(e) => setUserMessage(e.target.value)}
      multiline
    />
  );
}
