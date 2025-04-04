import { Typography } from "@mui/material";
import { SearchBarBox } from "../components/SearchBarBox";
import { useState } from "react";

export function ChatPrompterPage() {
  const [userQueryText, setUserQueryText] = useState<string>("");
  return (
    <>
      <Typography variant="body1" fontSize="20px" pl={2}>
        Chat Prompter
      </Typography>

      <SearchBarBox
        handleSearchQueryChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setUserQueryText(e.target.value)
        }
        handleSearchQuerySubmit={() => null}
        userQueryText={userQueryText}
        sx={{
          width: "45%",
        }}
      />
    </>
  );
}
