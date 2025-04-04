import { TextField } from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";

interface SearchBarProps {
  handleSearchQueryChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchQuerySubmit: () => void;
  userQueryText: string;
}

export function SearchBar({
  handleSearchQueryChange,
  handleSearchQuerySubmit,
  userQueryText,
}: SearchBarProps) {
  return (
    <TextField
      fullWidth
      placeholder="Enter Prompt"
      InputProps={{
        style: {
          fontSize: "16px",
        },
        endAdornment: (
          <SendIcon
            style={{
              cursor: "pointer",
              marginRight: "8px",
              color: "#10B981",
            }}
            onClick={() => {
              handleSearchQuerySubmit();
            }}
          />
        ),
      }}
      onKeyDown={(ev) => {
        if (ev.key !== "Enter") {
          return;
        }
        handleSearchQuerySubmit();
      }}
      onChange={handleSearchQueryChange}
      value={userQueryText}
    />
  );
}
