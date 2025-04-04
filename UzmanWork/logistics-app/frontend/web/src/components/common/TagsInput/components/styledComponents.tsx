import {
  autocompleteClasses,
  Box,
  List,
  ListItem,
  styled,
} from "@mui/material";

export const TagSuggestionsList = styled(List)(({ theme }) => ({
  width: "100%",
  margin: "2px 0 0",
  padding: 2,
  listStyle: "none",
  position: "absolute",
  backgroundColor: "#fff",
  overflow: "auto",
  maxHeight: "200px",
  borderRadius: "4px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
  zIndex: 1,

  "& li": {
    padding: "5px 12px",
    display: "flex",

    "& span": {
      flexGrow: 1,
    },

    "& svg": {
      color: "transparent",
    },
  },

  "& li[aria-selected='true']": {
    backgroundColor: "#F0F3FB",
    fontWeight: 600,

    "& svg": {
      color: theme.palette.primary.main,
    },
  },

  [`& li.${autocompleteClasses.focused}`]: {
    backgroundColor: "#F0F3FB",
    cursor: "pointer",

    "& svg": {
      color: "currentColor",
    },
  },
}));

export const TagSuggestionsListItem = styled(ListItem)({
  padding: "8px 16px",
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
});

export const InputWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  border: "1px solid transparent",
  borderRadius: "4px",
  padding: "4px 2px",
  gap: "4px",
  display: "flex",
  flexDirection: "row",
  "&.focused": {
    borderColor: theme.palette.primary.main,
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
}));

export const TagsInputField = styled("input")({
  fontSize: "12px",
  backgroundColor: "transparent",
  height: "24px",
  boxSizing: "border-box",
  padding: "4px 6px",
  width: 0,
  flexGrow: 1,
  border: 0,
  margin: 0,
  outline: 0,
});
