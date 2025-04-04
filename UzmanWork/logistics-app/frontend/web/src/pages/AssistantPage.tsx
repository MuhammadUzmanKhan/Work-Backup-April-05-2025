import { useState, useEffect } from "react";
import { SearchBar } from "components/discover/SearchBar";
import Grid from "@mui/material/Unstable_Grid2";
import { AssistantInfo } from "components/discover/AssistantInfo";
import Typography from "@mui/material/Typography";
import { Box, CircularProgress } from "@mui/material";
import { TextSearchService } from "coram-common-utils";

// component that displays assistant response to the user's query
function AssistantResponse({ query }: { query: string }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string>("");

  useEffect(() => {
    async function fetchResponse() {
      setLoading(true);
      setResponse(await TextSearchService.assistantQueryEndpoint(query));
      setLoading(false);
    }
    fetchResponse();
  }, [query]);

  return (
    <>
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            height: "100px",
            alignItems: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <Typography padding={2}>{response}</Typography>
      )}
    </>
  );
}

export function AssistantPage() {
  // A boolean to indicate whether the user has searched for something
  // This is used to hide TimelineQueryClips until the user has searched
  const [searched, setSearched] = useState<boolean>(false);
  // Content of search bar
  const [userInput, setUserInput] = useState<string>("");
  // Query to be sent to the backend
  const [query, setQuery] = useState<string>("");

  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  const handleSearchQuerySubmit = async () => {
    setSearched(true);
    setQuery(userInput);
  };

  return (
    <Grid container direction="column" style={{ height: "100%" }}>
      {!searched && (
        <Grid
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "20vh", // Set the height to fill the viewport
            fontStyle: "normal",
          }}
        >
          <AssistantInfo />
        </Grid>
      )}

      <div style={{ height: "16px" }}></div>

      {searched && (
        <Grid
          style={{
            position: "fixed",
            bottom: "20%",
            width: "50%",
            height: "20%",
            left: "30%",
            alignItems: "center",
            backgroundColor: "white",
            borderRadius: "4px",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
            margin: "16px",
          }}
        >
          {searched && <AssistantResponse query={query} />}
        </Grid>
      )}

      <Grid
        style={{
          position: "fixed",
          bottom: 0,
          width: "50%",
          left: "30%",
          alignItems: "center",
          backgroundColor: "white",
          borderRadius: "4px",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
          margin: "16px",
        }}
      >
        <SearchBar
          handleSearchQueryChange={handleSearchQueryChange}
          handleSearchQuerySubmit={handleSearchQuerySubmit}
          userQueryText={userInput}
        />
      </Grid>
    </Grid>
  );
}
