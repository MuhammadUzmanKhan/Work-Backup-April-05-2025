import type { TextFieldProps } from "@mui/material";
import { TextField } from "@mui/material";
import { isDefined } from "coram-common-utils";
import isEmail from "validator/lib/isEmail";

export function emailIsInvalid(email: string | undefined) {
  return isDefined(email) && email.length > 0 && !isEmail(email);
}

export function emailIsValid(email: string | undefined) {
  return isDefined(email) && email.length > 0 && isEmail(email);
}

export function EmailTextField(props: TextFieldProps) {
  return (
    <TextField
      {...props}
      error={emailIsInvalid(props.value as string | undefined)}
      helperText={
        emailIsInvalid(props.value as string | undefined)
          ? "Enter a valid email address."
          : ""
      }
      type="email"
    />
  );
}
