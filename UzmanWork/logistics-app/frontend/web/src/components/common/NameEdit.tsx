import {
  CircularProgress,
  ClickAwayListener,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  CheckOutlined as CheckOutlinedIcon,
  CloseOutlined as CloseOutlinedIcon,
} from "@mui/icons-material";
import { preventEventBubbling } from "utils/dom_event_handling";

const ACTION_BUTTON_WIDTH_PX = 56;

interface NameEditProps {
  prevName: string;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  onSubmit: (name: string) => Promise<void>;
  maxNameLength?: number;
  width?: string;
  fontSize?: string;
  fullWidth?: boolean;
}

export function NameEdit({
  prevName,
  setIsEditing,
  onSubmit,
  maxNameLength = 20,
  width = "8rem",
  fontSize = "14px",
  fullWidth,
}: NameEditProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(prevName);
  const submitDisabled = name.length === 0;

  useEffect(() => {
    setName(prevName);
  }, [prevName]);

  const onSubmitWrapper = useCallback(
    async (name: string) => {
      if (submitDisabled) {
        return;
      }
      setLoading(true);
      await onSubmit(name);
      setLoading(false);
      setIsEditing(false);
    },
    [onSubmit, setIsEditing, submitDisabled]
  );

  return (
    <ClickAwayListener onClickAway={() => setIsEditing(false)}>
      <Stack
        onKeyDown={preventEventBubbling}
        flexDirection="row"
        alignItems="center"
        sx={{
          cursor: "pointer",
          width: fullWidth ? "100%" : width,
        }}
      >
        <TextField
          autoFocus
          required
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setIsEditing(true);
          }}
          variant="standard"
          type="text"
          inputProps={{ maxLength: maxNameLength }}
          sx={{
            input: { color: "neutral.400", fontSize: fontSize },
            borderBottom: "none",
            mt: 0,
            minWidth: fullWidth
              ? `calc(100% - ${ACTION_BUTTON_WIDTH_PX}px)`
              : "2rem",
            maxWidth: "12.5rem",
          }}
          InputProps={{ disableUnderline: true }}
          onKeyDown={async (ev) => {
            if (ev.key !== "Enter") {
              return;
            }
            await onSubmitWrapper(name);
          }}
        />
        <CloseOutlinedIcon
          fontSize="small"
          color="disabled"
          sx={{ cursor: "pointer" }}
          onClick={() => setIsEditing(false)}
        />
        {!loading ? (
          <IconButton
            onClick={async () => await onSubmitWrapper(name)}
            disabled={submitDisabled}
          >
            <CheckOutlinedIcon fontSize="small" color="secondary" />
          </IconButton>
        ) : (
          <CircularProgress size={18} />
        )}
      </Stack>
    </ClickAwayListener>
  );
}
