import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { SearchFilter } from "components/common/search_filter/SearchFilter";
import { TimelineQueryClips } from "components/timeline/TimelineQueryClips";
import { HelpInfo } from "components/discover/HelpInfo";
import { Duration } from "luxon";
import { TOOLBAR_HEIGHT_PX } from "components/navbar/navbar";
import { CenteredStack } from "components/styled_components/CenteredStack";
import {
  LEFT_PADDING,
  MAX_SEARCH_RESULTS,
} from "components/discover/constants";
import { SearchBarBox } from "components/discover/SearchBarBox";
import { useDiscoverPage } from "hooks/useDiscoverPage";
import { SearchFilterContext } from "utils/search_filter";

export function DiscoverPageDesktop() {
  const {
    hasSubmittedSearch,
    userQueryText,
    numSearchResults,
    clipFilterState,
    filter,
    setFilter,
    searchResultsAreLoading,
    searchFilterIsFetched,
    setSearchResultsAreLoading,
    onSearchFilterChange,
    setNumSearchResults,
    handleSearchQuerySubmit,
    setUserQueryText,
  } = useDiscoverPage();

  return !searchFilterIsFetched ? (
    <Box p={12} justifyContent="center" alignItems="center" display="flex">
      <CircularProgress size={45} color="secondary" />
    </Box>
  ) : (
    <SearchFilterContext.Provider
      value={{
        filter,
        setFilter,
      }}
    >
      <Stack minHeight={`calc(100vh - ${TOOLBAR_HEIGHT_PX}px)`}>
        {/* InfoBar */}
        <Box display="flex" pt={3} pb={2} px={4}>
          {hasSubmittedSearch && !searchResultsAreLoading && (
            <Box>
              <Typography
                variant="body1"
                sx={{
                  maxWidth: "180px",
                  wordWrap: "break-word",
                }}
              >
                Top {numSearchResults} Results Found for &quot;
                {clipFilterState.searchQuery}&quot;
              </Typography>
            </Box>
          )}
          <Box
            position="fixed"
            right="50%"
            style={{ transform: "translateX(50%)" }}
          >
            <SearchFilter
              handleFilterUpdate={onSearchFilterChange}
              maxDurationBetweenSearchStartAndEndTime={Duration.fromObject({
                days: 7,
              })}
              maxDurationBetweenSearchStartTimeAndNow={Duration.fromObject({
                days: 30,
              })}
            />
          </Box>
        </Box>
        {!hasSubmittedSearch && (
          <CenteredStack>
            <HelpInfo sx={{ flexDirection: "row" }} />
          </CenteredStack>
        )}
        <Box
          padding={LEFT_PADDING}
          maxHeight="76vh"
          sx={{ overflowY: "scroll" }}
        >
          {hasSubmittedSearch && (
            <TimelineQueryClips
              clipFilter={clipFilterState}
              maxSearchResults={MAX_SEARCH_RESULTS}
              displayDate={true}
              setNumSearchResults={setNumSearchResults}
              setExternalIsLoading={setSearchResultsAreLoading}
            />
          )}
        </Box>
        <SearchBarBox
          handleSearchQueryChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setUserQueryText(e.target.value)
          }
          handleSearchQuerySubmit={handleSearchQuerySubmit}
          userQueryText={userQueryText}
          sx={{
            width: "45%",
          }}
        />
      </Stack>
    </SearchFilterContext.Provider>
  );
}
