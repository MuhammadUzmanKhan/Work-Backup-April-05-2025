import type { Control, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Switch, type SwitchProps } from "@mui/material";

export interface FormInputSwitchProps<T extends FieldValues>
  extends Omit<SwitchProps, "value" | "onChange"> {
  name: Path<T>;
  control: Control<T>;
}

export function FormInputSwitch<T extends FieldValues>({
  name,
  control,
  ...restProps
}: FormInputSwitchProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({
        field: { onChange, value, onBlur },
        formState: { isLoading, isSubmitting },
      }) => (
        <Switch
          onChange={onChange}
          onBlur={onBlur}
          checked={value}
          disabled={isLoading || isSubmitting}
          {...restProps}
        />
      )}
    />
  );
}
