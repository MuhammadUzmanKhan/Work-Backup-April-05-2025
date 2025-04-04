import { Button } from "@mui/material";
import { type ButtonProps } from "@mui/material";
import { ChevronLeft as ChevronLeftIcon } from "@mui/icons-material";

export function GoBackButton({ sx, ...rest }: ButtonProps) {
  return (
    <Button
      variant="outlined"
      color="info"
      {...rest}
      sx={{
        minWidth: "89px",
        maxHeight: "30px",
        padding: "0.5rem",
        paddingLeft: "0",
        borderRadius: "4px",
        ...sx,
      }}
      startIcon={
        <ChevronLeftIcon
          fontSize="small"
          sx={{
            color: "neutral.1000",
          }}
        />
      }
    />
  );
}
