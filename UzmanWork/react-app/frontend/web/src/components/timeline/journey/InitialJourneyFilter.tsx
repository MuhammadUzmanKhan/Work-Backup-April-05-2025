import { useState } from "react";
import { Button, CircularProgress, Stack, Typography } from "@mui/material";

import { TextFieldValidated } from "components/TextFieldValidated";
import { JOURNEY_DURATION_MINUTES } from "utils/player_options";
import { JourneyMode } from "pages/JourneyPage";

export const INITIAL_FILTER_STATE = {
  pastMins: JOURNEY_DURATION_MINUTES,
  futureMins: JOURNEY_DURATION_MINUTES,
  isValid: false,
};

const inputFieldStyle = {
  "& .MuiOutlinedInput-input": {
    width: "1.2rem",
    padding: "0.45rem 0.9rem",
    borderRadius: "4px",
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: "4px",
  },
};

const NUM_REGEX = /^\d+$/;

interface InitialJourneyFilterProps {
  onSearch: (pastMins: number, futureMins: number) => void;
  journeyMode: JourneyMode;
  setJourneyMode: React.Dispatch<React.SetStateAction<JourneyMode>>;
  isLoading: boolean;
}

export default function InitialJourneyFilter({
  onSearch,
  journeyMode,
  setJourneyMode,
  isLoading,
}: InitialJourneyFilterProps) {
  const [journeyFilter, setJourneyFilter] = useState(INITIAL_FILTER_STATE);

  const onSubmit = () => {
    setJourneyMode(JourneyMode.Initial);
    onSearch(Number(journeyFilter.pastMins), Number(journeyFilter.futureMins));
  };

  const isValid =
    !!journeyFilter.pastMins.match(NUM_REGEX) &&
    !!journeyFilter.futureMins.match(NUM_REGEX);

  return (
    <Stack
      flexDirection="row"
      gap={2}
      justifyContent="center"
      alignItems="center"
    >
      <TextFieldValidated
        validator={(value) => NUM_REGEX.test(value)}
        value={journeyFilter.pastMins}
        sx={{
          ...inputFieldStyle,
        }}
        variant="outlined"
        onChange={(event) =>
          setJourneyFilter((prev) => ({
            ...prev,
            pastMins: event.target.value,
          }))
        }
        InputProps={{
          endAdornment: <Typography variant="body3">Mins</Typography>,
        }}
        label="Past"
      />
      {"-"}
      <TextFieldValidated
        validator={(value) => NUM_REGEX.test(value)}
        value={journeyFilter.futureMins}
        sx={{
          ...inputFieldStyle,
        }}
        variant="outlined"
        onChange={(event) =>
          setJourneyFilter((prev) => ({
            ...prev,
            futureMins: event.target.value,
          }))
        }
        InputProps={{
          endAdornment: <Typography variant="body3">Mins</Typography>,
        }}
        label="Future"
      />
      {journeyMode === JourneyMode.Initial && (
        <Button
          variant="contained"
          color="secondary"
          disabled={!isValid}
          sx={{
            px: "1.91rem",
            py: "0.32rem",
            borderRadius: "0.25rem",
          }}
          onClick={onSubmit}
        >
          Search
        </Button>
      )}
      {isLoading && <CircularProgress size={30} color="secondary" />}
    </Stack>
  );
}
