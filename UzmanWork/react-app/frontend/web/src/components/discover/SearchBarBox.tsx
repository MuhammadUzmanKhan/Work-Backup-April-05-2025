import { Box, type SxProps } from "@mui/material";
import { SearchBar } from "./SearchBar";

interface SearchBarBoxProps {
  handleSearchQueryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchQuerySubmit: VoidFunction;
  userQueryText: string;
  sx?: SxProps;
}

export function SearchBarBox({
  handleSearchQueryChange,
  handleSearchQuerySubmit,
  userQueryText,
  sx,
}: SearchBarBoxProps) {
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: "16px",
        backgroundColor: "white",
        borderRadius: "4px",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        margin: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        ...sx,
      }}
    >
      <SearchBar
        handleSearchQueryChange={handleSearchQueryChange}
        handleSearchQuerySubmit={handleSearchQuerySubmit}
        userQueryText={userQueryText}
      />
    </Box>
  );
}
