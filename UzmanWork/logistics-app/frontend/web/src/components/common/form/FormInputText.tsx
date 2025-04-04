import type { Control, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { TextFieldProps } from "@mui/material";
import { TextField } from "@mui/material";

export interface FormInputTextProps<T extends FieldValues>
  extends Omit<TextFieldProps, "value" | "onChange"> {
  name: Path<T>;
  control: Control<T>;
}

export function FormInputText<T extends FieldValues>({
  name,
  control,
  ...restProps
}: FormInputTextProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({
        field: { onChange, value, onBlur },
        fieldState: { error },
        formState: { isLoading, isSubmitting },
      }) => (
        <TextField
          helperText={error ? error.message : null}
          error={!!error}
          onChange={onChange}
          onBlur={onBlur}
          value={value}
          disabled={isLoading || isSubmitting}
          FormHelperTextProps={{ sx: { position: "absolute", bottom: -20 } }}
          {...restProps}
        />
      )}
    />
  );
}
