import type { TypographyVariant } from "@mui/material";

export interface EditableTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
  placeholder?: string;
  width?: string;
  variant?: TypographyVariant;
  maxLength?: number;
}
