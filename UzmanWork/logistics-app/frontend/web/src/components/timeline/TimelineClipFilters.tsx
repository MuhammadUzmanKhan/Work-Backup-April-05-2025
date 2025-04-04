import {
  Clear as ClearIcon,
  SearchOutlined as SearchOutlinedIcon,
} from "@mui/icons-material";
import { MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { DetectionObjectTypeCategory } from "coram-common-utils";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { ClipFilterState, ClipMode } from "./utils";
import { DateTime } from "luxon";
import { type SortOrder, SortSelector } from "components/common/SortSelector";
import { ProgressSlider } from "components/common/ProgressSlider";
import { TimePicker } from "features/timePicker/TimePicker";

const MAX_VIDEO_LENGTH_MARKS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 5, label: "5" },
  { value: 10, label: "10 min" },
];

export const CLIP_FILTER_OBJECT_TYPES = [
  "All",
  DetectionObjectTypeCategory.PERSON,
  DetectionObjectTypeCategory.VEHICLE,
  DetectionObjectTypeCategory.MOTION,
];

const selectorStyles = {
  position: "relative",
  fontWeight: "200",
  minWidth: 100,
  height: "30px",
  mr: 1,
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
};

interface ClipFiltersProps {
  clipFilterState: ClipFilterState;
  setClipFilterState: Dispatch<SetStateAction<ClipFilterState>>;
}

enum TIME {
  TIME_START = "timeStart",
  TIME_END = "timeEnd",
}

export function ClipFilters({
  clipFilterState,
  setClipFilterState,
}: ClipFiltersProps) {
  // Search query state, this is kept separate from clipFilterState
  // because we don't want to update the clipFilterState on every change
  const [textSearch, setTextSearch] = useState<string>("");

  // When the clipFilterState changes reflect it in the textSearch state
  useEffect(() => {
    if (clipFilterState.mode === ClipMode.SEARCH_QUERY) {
      setTextSearch(clipFilterState.searchQuery);
    } else {
      setTextSearch("");
    }
  }, [clipFilterState]);

  // Update search query state on input change
  function handleSearchQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value) {
      setTextSearch(e.target.value);
    } else {
      // Go back to events mode if search query is empty
      setClipFilterState((prevState: ClipFilterState) => ({
        ...prevState,
        searchQuery: "",
        mode: ClipMode.EVENTS,
      }));
    }
  }

  function handleTimeChange(value: DateTime, key: TIME) {
    setClipFilterState((prevState: ClipFilterState) => ({
      ...prevState,
      timeInterval: {
        ...prevState.timeInterval,
        [key]: value,
      },
    }));
  }

  function handleDurationChange(value: number) {
    setClipFilterState((prevState: ClipFilterState) => ({
      ...prevState,
      maxVideoLengthMin: value,
    }));
  }

  function resetOnBlur() {
    setClipFilterState((prevState: ClipFilterState) => ({
      ...prevState,
      timeInterval: {
        timeStart: prevState.timeInterval.timeStart,
        timeEnd: prevState.timeInterval.timeEnd,
      },
    }));
  }

  return (
    <Stack flexDirection="row" justifyContent="space-between" my={3}>
      <Stack flexDirection="row" alignItems="center" columnGap={2}>
        <Stack flexDirection="row" alignItems="center" columnGap={1}>
          <Typography variant="body2">Time:</Typography>
          <TimePicker
            placeholder="hh:mm:ss"
            time={clipFilterState.timeInterval.timeStart}
            setTime={(time) => handleTimeChange(time, TIME.TIME_START)}
            onBlur={(event) => {
              if (event.target.value === "") {
                resetOnBlur();
              }
            }}
          />
          <Typography>-</Typography>
          <TimePicker
            placeholder="hh:mm:ss"
            time={clipFilterState.timeInterval.timeEnd}
            setTime={(time) => handleTimeChange(time, TIME.TIME_END)}
            onBlur={(event) => {
              if (event.target.value === "") {
                resetOnBlur();
              }
            }}
          />
        </Stack>
        <SortSelector
          value={clipFilterState.sortOrder}
          onChange={(event) => {
            setClipFilterState((prevState: ClipFilterState) => ({
              ...prevState,
              sortOrder: event.target.value as SortOrder,
            }));
          }}
          sx={{ ...selectorStyles }}
        />
      </Stack>
      <ProgressSlider
        name="Clip Length"
        onProgressChange={handleDurationChange}
        marks={MAX_VIDEO_LENGTH_MARKS}
        defaultValue={5}
        min={1}
        max={10}
        sx={{
          minWidth: "200px",
          minHeight: "2.75rem",
          p: 0,
          m: 0,
        }}
      />
      <Stack flexDirection="row" alignItems="center" columnGap={1}>
        <Stack flexDirection="row" alignItems="center" columnGap={1}>
          <Typography variant="body2">Object:</Typography>
          <Select
            disabled={clipFilterState.mode === ClipMode.SEARCH_QUERY}
            defaultValue={CLIP_FILTER_OBJECT_TYPES[0]}
            displayEmpty
            value={clipFilterState.objectFilter}
            onChange={(event) => {
              const filter = event.target.value as string;
              setClipFilterState((prevState: ClipFilterState) => ({
                ...prevState,
                objectFilter: filter,
              }));
            }}
            sx={{
              ...selectorStyles,
            }}
          >
            {CLIP_FILTER_OBJECT_TYPES.map((option) => {
              return (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              );
            })}
          </Select>
        </Stack>
        <Stack
          flexDirection="row"
          sx={{
            minWidth: "150px",
            borderColor: "neutral.1000",
            border: "1px solid",
            alignItems: "center",
            px: 1,
            borderRadius: "4px",
            height: "30px",
          }}
        >
          <TextField
            placeholder="Search"
            variant="standard"
            value={textSearch}
            onKeyDown={(ev) => {
              if (ev.key !== "Enter" || !textSearch) {
                return;
              }
              setClipFilterState((prevState: ClipFilterState) => ({
                ...prevState,
                mode: ClipMode.SEARCH_QUERY,
                searchQuery: textSearch,
              }));
            }}
            onChange={handleSearchQueryChange}
            InputProps={{
              disableUnderline: true,
            }}
          />
          {clipFilterState.mode === ClipMode.SEARCH_QUERY && (
            <ClearIcon
              sx={{ fontSize: 18, cursor: "pointer" }}
              onClick={() => {
                setClipFilterState((prevState: ClipFilterState) => ({
                  ...prevState,
                  mode: ClipMode.EVENTS,
                  searchQuery: "",
                }));
              }}
            />
          )}
          {clipFilterState.mode === ClipMode.EVENTS && (
            <SearchOutlinedIcon
              sx={{ fontSize: 18, cursor: "pointer" }}
              onClick={() => {
                if (!textSearch) {
                  return;
                }
                setClipFilterState((prevState: ClipFilterState) => ({
                  ...prevState,
                  mode: ClipMode.SEARCH_QUERY,
                  searchQuery: textSearch,
                }));
              }}
            />
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}
