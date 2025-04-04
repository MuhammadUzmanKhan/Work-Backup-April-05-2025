import { Select } from "@mui/material";

// TODO(@lberg): reuse this component in other places
export function StyledSelect(props: Parameters<typeof Select>[0]) {
  return (
    <Select
      {...props}
      sx={{
        position: "relative",
        fontWeight: "200",
        borderRadius: "0.2rem",
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "neutral.1000",
        },
        "& .MuiOutlinedInput-input": {
          color: "neutral.1000",
        },
        "& .MuiSelect-outlined": {
          p: 1,
          px: 2,
        },
        ...props.sx,
      }}
    />
  );
}
