import { useEffect, useState } from "react";
import { Stack, TextField } from "@mui/material";
import type { SxProps } from "@mui/material";
import {
  SearchOutlined as SearchOutlinedIcon,
  CloseOutlined as CloseOutlinedIcon,
} from "@mui/icons-material";

interface SearchInputProps {
  placeHolder: string;
  value: string;
  onChange: (value: string) => void;
  sx?: SxProps;
  textFieldSx?: SxProps;
}

export function SearchInput({
  placeHolder,
  value,
  onChange,
  sx,
  textFieldSx,
}: SearchInputProps) {
  const [input, setInput] = useState(value);

  // If the external input is reset, reset the internal input too.
  // NOTE(@lberg): It would be better to not have the internal state
  // at all, but that requires all consumers to apply the text transform.
  useEffect(() => {
    if (value.length === 0) {
      setInput(value);
    }
  }, [value]);

  const updateInput = (newValue: string) => {
    setInput(newValue);
    onChange(newValue.toLowerCase().trim());
  };
  return (
    <Stack
      flexDirection="row"
      px={1}
      borderRadius="4px"
      justifyContent="space-between"
      alignItems="center"
      border="1px solid #d3d3d3"
      sx={sx}
    >
      <TextField
        placeholder={placeHolder}
        variant="standard"
        value={input}
        onChange={(ev) => updateInput(ev.target.value)}
        fullWidth={true}
        sx={{
          input: {
            paddingY: "0.7rem",
          },
          ...textFieldSx,
        }}
        InputProps={{
          disableUnderline: true,
        }}
      />
      {value.length > 0 ? (
        <CloseOutlinedIcon
          color="disabled"
          sx={{ cursor: "pointer" }}
          onClick={() => updateInput("")}
        />
      ) : (
        <SearchOutlinedIcon />
      )}
    </Stack>
  );
}
