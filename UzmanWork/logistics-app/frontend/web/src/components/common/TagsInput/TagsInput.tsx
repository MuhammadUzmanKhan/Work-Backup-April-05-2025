import {
  Box,
  Button,
  Chip,
  CircularProgress,
  ClickAwayListener,
  ListItem,
  Stack,
  Typography,
  useAutocomplete,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { RefObject, useState } from "react";
import {
  InputWrapper,
  TagChip,
  TagsInputField,
  TagSuggestionsList,
  TagSuggestionsListItem,
} from "./components";
import { Add as AddIcon } from "@mui/icons-material";
import { isDefined, MountIf } from "coram-common-utils";
import { TAG_CHIP_HEIGHT, TAG_LINE_HEIGHT } from "./consts";
import { useSyncedState } from "common/hooks";

interface Tag {
  id: number;
  name: string;
}

interface TagsInputProps {
  selectedTags: Tag[];
  availableTags: Tag[];
  onTagsChange: (tags: Tag[]) => Promise<void>;
  onCreateTag: (name: string) => Promise<Tag>;
  isLoading: boolean;
  editable?: boolean;
  maxLines?: number;
}

export function TagsInput({
  selectedTags,
  onTagsChange,
  availableTags,
  onCreateTag,
  isLoading,
  editable = true,
  maxLines,
}: TagsInputProps) {
  const [open, setOpen] = useState(false);

  const [inputValue, setInputValue] = useState("");

  const [tags, setTags] = useSyncedState(selectedTags);
  const [visibleTags, setVisibleTags] = useState<Set<number>>(new Set());
  const showMoreTagsLabel =
    isDefined(maxLines) && visibleTags.size !== tags.length;

  async function updateTags(newTags: Tag[]) {
    setTags(newTags);
    await onTagsChange(newTags);

    // when we select we loose focus from the input, then we need to restore it
    // https://github.com/mui/material-ui/issues/36575
    const typedInputProps = getInputProps() as {
      ref: RefObject<HTMLInputElement> | undefined;
    };
    const inputEl = typedInputProps.ref?.current;
    if (isDefined(inputEl) && inputEl !== document.activeElement) {
      inputEl.focus();
    }
  }

  async function handleCreateAndAddTag() {
    const newTag = await onCreateTag(inputValue);
    setInputValue("");
    await updateTags([...tags, newTag]);
  }

  const {
    getRootProps,
    getInputProps,
    getTagProps,
    getListboxProps,
    getOptionProps,
    groupedOptions,
    value,
    setAnchorEl,
    popupOpen,
  } = useAutocomplete({
    open: open,
    value: tags,
    multiple: true,
    // somehow blur is triggered when user does nothing in a couple of seconds.
    // we don't want to clear the input in that case, so we manage input state manually
    clearOnBlur: false,
    disabled: isLoading || !editable,
    options: availableTags,
    disableCloseOnSelect: true,
    getOptionLabel: (option) => option.name,
    inputValue,
    isOptionEqualToValue: (option, value) => option.id === value.id,
    onInputChange: (_, newInputValue) => setInputValue(newInputValue),
    onChange: async (_, newTags) => updateTags(newTags),
  });

  const hasTagMatchesInput = availableTags.some(
    (tag) => tag.name.toLowerCase() === inputValue.toLowerCase()
  );

  function handleTagVisibilityChange(tagId: number, isVisible: boolean) {
    if (isVisible) {
      setVisibleTags(new Set([...visibleTags, tagId]));
    } else {
      const newVisibleTags = new Set(visibleTags);
      newVisibleTags.delete(tagId);
      setVisibleTags(newVisibleTags);
    }
  }

  function handleOpen() {
    if (editable) {
      setOpen(true);
    }
  }

  function handleClose() {
    if (editable) {
      setOpen(false);
      setInputValue("");
    }
  }

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Box position="relative" width="100%">
        <InputWrapper
          className={popupOpen ? "focused" : ""}
          ref={setAnchorEl}
          sx={(theme) => ({
            ...(isDefined(maxLines) && {
              maxHeight: `${maxLines * TAG_LINE_HEIGHT}px`,
              overflow: "hidden",
            }),
            "&:hover": {
              backgroundColor: editable
                ? theme.palette.inputsBackgroundHover.main
                : "transparent",
            },
          })}
          {...getRootProps()}
          onClick={handleOpen}
        >
          <Stack direction="row" flexWrap="wrap" gap={1} flexGrow={1}>
            {value.length > 0 ? (
              value.map((tag: Tag, index: number) => (
                <TagChip
                  tag={tag.name}
                  showDelete={popupOpen}
                  {...getTagProps({ index })}
                  key={tag.id}
                  onVisibilityChange={(isVisible) =>
                    handleTagVisibilityChange(tag.id, isVisible)
                  }
                />
              ))
            ) : (
              <Box height={TAG_CHIP_HEIGHT + "px"} />
            )}
            <TagsInputField
              sx={(theme) => ({
                "::placeholder": {
                  color: theme.palette.primary.main,
                  ...(popupOpen && {
                    opacity: 0,
                  }),
                },
                // we need to remove input from dom when tags input is not editable
                // we had to do it with display none because of the useAutocomplete which requires
                // getInputProps() to present otherwise it will throw an error
                display: editable ? "block" : "none",
              })}
              placeholder={
                editable && value.length === 0 ? "+ Add Tag" : undefined
              }
              {...getInputProps()}
              value={inputValue}
            />
            {isLoading && (
              <Stack minHeight="100%" p={0.45}>
                <CircularProgress color="secondary" size={16} />
              </Stack>
            )}
          </Stack>
          {showMoreTagsLabel && (
            <Chip
              label={`+${tags.length - visibleTags.size}`}
              size="small"
              sx={(theme) => ({
                bgcolor: "#F0F3FB !important",
                color: theme.palette.primary.main,
              })}
            />
          )}
        </InputWrapper>
        <TagSuggestionsList
          {...getListboxProps()}
          sx={{
            display: popupOpen ? "block" : "none",
          }}
        >
          {(groupedOptions as Tag[]).map((tag, index) => (
            <TagSuggestionsListItem
              key={tag.id}
              {...getOptionProps({ option: tag, index })}
            >
              <Typography variant="body1">{tag.name}</Typography>
              <CheckIcon fontSize="small" />
            </TagSuggestionsListItem>
          ))}
          <MountIf condition={inputValue !== "" && !hasTagMatchesInput}>
            <ListItem
              sx={{
                display: "flex",
                height: "100%",
                alignItems: "flex-start",
                flexDirection: "column",
                gap: 0.5,
                ...(groupedOptions.length > 0 && {
                  borderTop: "1px dashed #E0E0E0",
                }),
              }}
            >
              <Typography variant="body1" color="text.secondary">
                No exact match found
              </Typography>
              <Button
                variant="text"
                sx={{
                  fontSize: "14px",
                  p: 0,
                  "& svg": {
                    width: "auto",
                    height: "auto",
                  },
                  "& .MuiButton-startIcon": { margin: "0" },
                }}
                disabled={isLoading || inputValue.length < 2}
                startIcon={<AddIcon />}
                onClick={handleCreateAndAddTag}
              >
                + Add New Tag
              </Button>
            </ListItem>
          </MountIf>
        </TagSuggestionsList>
      </Box>
    </ClickAwayListener>
  );
}
