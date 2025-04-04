import { TextField } from "@mui/material";
import type { TextFieldProps } from "@mui/material";
import { useEffect, useRef } from "react";

type TextFieldValidatedProps = TextFieldProps & {
  validator: (value: string) => boolean;
  setError?: (error: boolean) => void;
};

export function TextFieldValidated(props: TextFieldValidatedProps) {
  const { validator, setError, ...rest } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const setErrorRef = useRef(setError);
  setErrorRef.current = setError;

  let error = false || !!props.error;
  if (inputRef.current && inputRef.current.value) {
    error = !validator(inputRef.current.value);
  }

  useEffect(() => {
    setErrorRef.current?.(error);
  }, [error]);

  return (
    <TextField
      inputRef={inputRef}
      {...rest}
      error={error}
      inputProps={props.inputProps}
      helperText={error ? props.helperText : ""}
    />
  );
}
