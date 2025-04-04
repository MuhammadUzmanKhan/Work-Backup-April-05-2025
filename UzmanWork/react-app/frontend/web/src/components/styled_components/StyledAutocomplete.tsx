import type { AutocompleteProps, ChipTypeMap } from "@mui/material";
import { Autocomplete, Box, CircularProgress, TextField } from "@mui/material";
import { ElementType } from "react";

export interface StyledAutocompleteProps<
  T,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
  ChipComponent extends ElementType = ChipTypeMap["defaultComponent"]
> extends Omit<
    AutocompleteProps<T, Multiple, DisableClearable, FreeSolo, ChipComponent>,
    "renderInput"
  > {
  showProgress?: boolean;
}

export function StyledAutocomplete<
  T,
  Multiple extends boolean | undefined = false,
  DisableClearable extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
>({
  componentsProps,
  showProgress,
  ...rest
}: StyledAutocompleteProps<T, Multiple, DisableClearable, FreeSolo>) {
  return (
    <Autocomplete
      renderInput={(params) => (
        <TextField
          {...params}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {showProgress ? (
                  // The same positioning as the default endAdornment
                  <Box
                    sx={{
                      position: "absolute",
                      right: "9px",
                      top: "calc(50% - 10px)",
                    }}
                  >
                    <CircularProgress color="secondary" size={20} />
                  </Box>
                ) : (
                  params.InputProps.endAdornment
                )}
              </>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              fontSize: "13px",
              borderRadius: "4px",
              p: 0.5,
              px: 1,
            },
          }}
        />
      )}
      componentsProps={{
        paper: {
          sx: {
            border: "1px solid rgba(0, 0, 0, 0.2)",
          },
        },
        popper: {
          modifiers: [
            {
              name: "flip",
              enabled: false,
            },
            {
              name: "preventOverflow",
              enabled: false,
            },
          ],
        },
        ...componentsProps,
      }}
      disablePortal
      fullWidth
      {...rest}
    />
  );
}
