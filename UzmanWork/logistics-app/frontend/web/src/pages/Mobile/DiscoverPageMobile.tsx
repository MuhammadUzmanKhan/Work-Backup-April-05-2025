import {
  Box,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { SearchFilter } from "components/common/search_filter/SearchFilter";
import { TimelineQueryClips } from "components/timeline/TimelineQueryClips";
import { HelpInfo } from "components/discover/HelpInfo";
import { Duration } from "luxon";
import React, { useRef, useState } from "react";
import { HeaderMobile } from "components/settings/mobile/HeaderMobile";
import { FilterIcon } from "icons/filter-icon";
import { CenteredStack } from "components/styled_components/CenteredStack";
import { ClearOutlined as ClearOutlinedIcon } from "@mui/icons-material";
import {
  LEFT_PADDING,
  MAX_SEARCH_RESULTS,
} from "components/discover/constants";
import { SearchBarBox } from "components/discover/SearchBarBox";
import { useDiscoverPage } from "hooks/useDiscoverPage";
import { SearchFilterContext } from "utils/search_filter";

const DISCOVER_HEADER_HEIGHT_PX = 100;

export function DiscoverPageMobile() {
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

  const [showSearchFilter, setShowFilter] = useState(false);
  const anchorEl = useRef<HTMLButtonElement | null>(null);

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
      <Stack
        minHeight={`calc(100vh - ${DISCOVER_HEADER_HEIGHT_PX}px)`}
        maxWidth="100vw"
      >
        <HeaderMobile>
          <Typography variant="h2">Discover</Typography>
          <IconButton
            ref={anchorEl}
            onClick={() => setShowFilter(!showSearchFilter)}
            sx={{ minWidth: "20px", p: 0 }}
          >
            {showSearchFilter ? (
              <ClearOutlinedIcon fontSize="small" />
            ) : (
              <FilterIcon />
            )}
          </IconButton>
          <Menu
            open={showSearchFilter}
            onClose={() => setShowFilter(false)}
            anchorEl={anchorEl.current}
            anchorOrigin={{
              vertical: 50,
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <MenuItem>
              <SearchFilter
                handleFilterUpdate={onSearchFilterChange}
                maxDurationBetweenSearchStartAndEndTime={Duration.fromObject({
                  days: 7,
                })}
                maxDurationBetweenSearchStartTimeAndNow={Duration.fromObject({
                  days: 30,
                })}
                containerSx={{ flexWrap: "wrap" }}
                selectorSx={{
                  gap: "12px",
                  flexGrow: "1",
                }}
                datePickerContainerSx={{
                  minWidth: "100%",
                }}
                dateFieldMinWidth={"auto"}
                dateFieldFlexGrow={1}
                fetchDataOnMount={false}
              />
            </MenuItem>
          </Menu>
        </HeaderMobile>
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
        </Box>
        {!hasSubmittedSearch && (
          <CenteredStack sx={{ minHeight: "66vh" }}>
            <HelpInfo />
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
              colSize={6}
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
            transform: "none",
            left: 0,
            right: 0,
          }}
        />
      </Stack>
    </SearchFilterContext.Provider>
  );
}
