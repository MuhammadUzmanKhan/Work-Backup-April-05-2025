import {
  Box,
  MenuItem,
  Pagination,
  PaginationItem,
  Select,
  Stack,
  Typography,
  styled,
} from "@mui/material";
import type { PaginationProps, SxProps } from "@mui/material";

import {
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
} from "@mui/icons-material";

export const ITEMS_PER_PAGE = [10, 20, 30, 40, 50];

function PrevIcon() {
  return (
    <Box flexDirection="row" alignItems="center" display="flex">
      <ArrowBackIosIcon sx={{ fontSize: "0.7rem" }} />
      <Typography variant="body2">Prev</Typography>
    </Box>
  );
}

function NextIcon() {
  return (
    <Box flexDirection="row" alignItems="center" display="flex">
      <Typography variant="body2">Next</Typography>
      <ArrowForwardIosIcon sx={{ fontSize: "0.7rem" }} />
    </Box>
  );
}

export interface PaginationData {
  itemsPerPage: number;
  page: number;
}

interface PaginationNavigatorProps extends PaginationData {
  numItems: number;
  setPage: (page: number) => void;
  size?: PaginationProps["size"];
}

export function PaginationNavigator({
  numItems,
  itemsPerPage,
  page,
  setPage,
  size = "medium",
}: PaginationNavigatorProps) {
  return (
    <Pagination
      sx={{
        "& button.Mui-selected": {
          backgroundColor: "black !important",
          color: "white !important",
        },
        "& button.MuiPaginationItem-page ": {
          border: "none",
        },
        "& button.MuiPaginationItem-previousNext ": {
          borderRadius: "0.3rem",
          px: "0.8rem",
        },
      }}
      count={Math.ceil(numItems / itemsPerPage)}
      variant="outlined"
      shape="rounded"
      page={page + 1}
      size={size}
      onChange={(_event, page: number) => {
        setPage(page - 1);
      }}
      renderItem={(item) => (
        <PaginationItem
          slots={{ previous: PrevIcon, next: NextIcon }}
          {...item}
        />
      )}
    />
  );
}

const RowPerPageSelector = styled(Select)({
  position: "relative",
  fontWeight: "200",
  minWidth: 20,
  height: "30px",
  mr: 1,
  borderRadius: "0.2rem",
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "neutral.1000",
  },
  "& .MuiOutlinedInput-input": {
    color: "neutral.1000",
    fontWeight: "400",
  },
  "& .MuiSelect-outlined": {
    py: 1,
    px: 2,
  },
});

interface PaginationSelectorProps {
  itemsPerPage: number;
  setItemsPerPage: (itemsPerPage: number) => void;
  itemsPerPageOptions: number[];
}

export function PaginationSelector({
  itemsPerPage,
  setItemsPerPage,
  itemsPerPageOptions,
}: PaginationSelectorProps) {
  const allItemsPerPageOptions = [...itemsPerPageOptions];
  // Add the item to the options if it's not a valid value
  // Otherwise we get warnings and the selected value is not displayed
  if (!itemsPerPageOptions.includes(itemsPerPage)) {
    allItemsPerPageOptions.push(itemsPerPage);
    allItemsPerPageOptions.sort((a, b) => a - b);
  }

  return (
    <Typography variant="body2" p={1}>
      Show{" "}
      <RowPerPageSelector
        defaultValue={allItemsPerPageOptions[0]}
        value={itemsPerPage}
        displayEmpty={false}
        onChange={(event) => {
          setItemsPerPage(event.target.value as number);
        }}
      >
        {allItemsPerPageOptions.map((option) => {
          return (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          );
        })}
      </RowPerPageSelector>{" "}
      results per page
    </Typography>
  );
}

interface PaginatorProps {
  numItems: number;
  sx?: SxProps;
  paginationData: PaginationData;
  setItemsPerPage: (itemsPerPage: number) => void;
  setPage: (page: number) => void;
  itemsPerPageOptions?: number[];
}

export function Paginator({
  numItems,
  sx,
  paginationData,
  setItemsPerPage,
  setPage,
  itemsPerPageOptions = ITEMS_PER_PAGE,
}: PaginatorProps) {
  return (
    <Stack
      direction="row"
      display="flex"
      alignItems="center"
      justifyContent="end"
      sx={sx}
    >
      <PaginationSelector
        itemsPerPage={paginationData.itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        itemsPerPageOptions={itemsPerPageOptions}
      />
      <PaginationNavigator
        {...paginationData}
        numItems={numItems}
        setPage={setPage}
      />
    </Stack>
  );
}
