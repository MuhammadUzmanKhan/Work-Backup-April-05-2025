import {
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Stack,
} from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";
import { Dispatch, SetStateAction } from "react";
import { Location, isDefined } from "coram-common-utils";
import { LocationSelector } from "./utils/LocationSelector";

interface WallCameraSelectorProps {
  setCameraFilter: Dispatch<SetStateAction<string>>;
  onNewWallCancel?: VoidFunction;
  selectedLocation: Location | undefined;
  setSelectedLocation: Dispatch<SetStateAction<Location | undefined>>;
}

export function WallCameraSelector({
  setCameraFilter,
  onNewWallCancel,
  selectedLocation,
  setSelectedLocation,
}: WallCameraSelectorProps) {
  return (
    <Stack>
      {isDefined(onNewWallCancel) && (
        <CloseIcon
          sx={{ cursor: "pointer", alignSelf: "flex-end" }}
          onClick={() => onNewWallCancel()}
        />
      )}
      <Typography
        variant="body1"
        sx={{
          paddingBottom: 2,
          width: "100%",
          fontWeight: "bold",
        }}
      >
        Select Cameras
      </Typography>

      <LocationSelector
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
      />

      <TextField
        placeholder="Search"
        sx={{
          paddingBottom: 2,
          input: {
            display: "flex",
            alignItems: "center",
            height: "0.3rem",
            textAlign: "left",
          },
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton>
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        onChange={(e) => setCameraFilter(e.target.value)}
      />
    </Stack>
  );
}
