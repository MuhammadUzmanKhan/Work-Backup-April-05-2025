import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { DateTime } from "luxon";
import { JourneyFilterState } from "./utils";
import { TextFieldValidated } from "components/TextFieldValidated";
import { JOURNEY_DURATION_MINUTES } from "utils/player_options";

interface JourneyFiltersProps {
  detectionTime: DateTime;
  setJourneyFilterState: Dispatch<SetStateAction<JourneyFilterState>>;
}
const INITIAL_FILTER_STATE = {
  pastMins: JOURNEY_DURATION_MINUTES,
  futureMins: JOURNEY_DURATION_MINUTES,
  isValid: false,
};

const inputFieldStyle = {
  input: { fontSize: "14px" },
  "& .MuiOutlinedInput-input": {
    width: "6rem",
    padding: "0.45rem 0.9rem",
    borderRadius: "4px",
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: "4px",
  },
};

const NUM_REGEX = /^\d*$/;

export function JourneyFilters({
  detectionTime,
  setJourneyFilterState,
}: JourneyFiltersProps) {
  const [journeyFilter, setJourneyFilter] = useState(INITIAL_FILTER_STATE);

  const onSubmit = () => {
    setJourneyFilterState((prevState) => ({
      ...prevState,
      timeInterval: {
        timeStart:
          detectionTime
            .minus({
              minutes: Number(journeyFilter.pastMins),
            })
            .toUTC()
            .toISO() || "",
        timeEnd:
          detectionTime
            .plus({
              minutes: Number(journeyFilter.futureMins),
            })
            .toUTC()
            .toISO() || "",
      },
    }));
  };

  useEffect(() => {
    const { pastMins, futureMins } = journeyFilter;
    if (
      !pastMins.match(NUM_REGEX) ||
      !futureMins.match(NUM_REGEX) ||
      (!pastMins && !futureMins)
    )
      setJourneyFilter((prev) => ({ ...prev, isValid: false }));
    else setJourneyFilter((prev) => ({ ...prev, isValid: true }));
  }, [journeyFilter]);

  return (
    <Stack my={3} minHeight={4}>
      <Box
        sx={{
          border: "2px solid #C3C9D4",
          width: "7.5rem",
          height: "7.5rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <img
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
          src="/static/user1.png"
        />
      </Box>
      <Stack
        flexDirection="row"
        alignItems="center"
        justifyContent="flex-start"
        gap={2}
      >
        <Typography variant="body1">
          {detectionTime.toFormat("dd MMM, hh:mm:ss a")}
        </Typography>
        <TextFieldValidated
          validator={(value) => NUM_REGEX.test(value)}
          placeholder="Search Past"
          value={journeyFilter.pastMins}
          sx={inputFieldStyle}
          variant="outlined"
          onChange={(event) =>
            setJourneyFilter((prev) => ({
              ...prev,
              pastMins: event.target.value,
            }))
          }
          InputProps={{
            endAdornment: <Typography variant="body2">Mins</Typography>,
          }}
        />
        {"-"}
        <TextFieldValidated
          validator={(value) => NUM_REGEX.test(value)}
          placeholder="Search Future"
          value={journeyFilter.futureMins}
          sx={inputFieldStyle}
          variant="outlined"
          onChange={(event) =>
            setJourneyFilter((prev) => ({
              ...prev,
              futureMins: event.target.value,
            }))
          }
          InputProps={{
            endAdornment: <Typography variant="body2">Mins</Typography>,
          }}
        />
        <Button
          variant="contained"
          color="secondary"
          disabled={!journeyFilter.isValid}
          sx={{
            px: "2rem",
            py: "0.32rem",
            borderRadius: "0.3rem",
            fontWeight: 600,
            letterSpacing: "1.05px",
          }}
          onClick={onSubmit}
        >
          Search
        </Button>
      </Stack>
    </Stack>
  );
}

export default JourneyFilters;
