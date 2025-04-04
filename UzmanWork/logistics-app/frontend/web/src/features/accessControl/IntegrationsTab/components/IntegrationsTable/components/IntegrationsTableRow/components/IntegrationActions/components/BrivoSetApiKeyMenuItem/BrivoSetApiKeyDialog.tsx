import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import DialogActions from "@mui/material/DialogActions";
import { ChangeEvent, useContext, useEffect, useState } from "react";
import { AccessControlService } from "coram-common-utils";
import { NotificationContext } from "contexts/notification_context";

export interface BrivoSetApiKeyDialogProps {
  open: boolean;
  onClose: VoidFunction;
}

export function BrivoSetApiKeyDialog({
  open,
  onClose,
}: BrivoSetApiKeyDialogProps) {
  const { setNotificationData } = useContext(NotificationContext);

  const [apiKey, setApiKey] = useState<string>("");
  const [showError, setShowError] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowError(false);
      setApiKey("");
    }

    AccessControlService.brivoGetApiKey().then(({ api_key }) => {
      setApiKey(api_key ?? "");
    });
  }, [open]);

  function handleApiKeyChange(e: ChangeEvent<HTMLInputElement>) {
    setApiKey(e.target.value);
    setShowError(false);
  }

  async function handleUpdateApiKey() {
    try {
      setIsLoading(true);
      await AccessControlService.brivoSetApiKey({ api_key: apiKey });
      setNotificationData({
        message: "Brivo API Key successfully updated.",
        severity: "success",
      });
      onClose();
    } catch {
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== "backdropClick") {
          onClose();
        }
      }}
      fullWidth
    >
      <DialogTitle>
        <Stack
          direction="row"
          py={1}
          alignItems="center"
          justifyContent="space-between"
          width="100%"
        >
          <Typography variant="h2">Brivo Integration: setup API Key</Typography>
          <CloseIcon sx={{ cursor: "pointer" }} onClick={onClose} />
        </Stack>
        <Divider sx={{ width: "100%", marginTop: "0.45rem" }} />
      </DialogTitle>
      <DialogContent>
        <Stack alignItems="left" gap={2}>
          <Typography variant="body2">
            To proceed with the Brivo integration, it is required to set your
            API Key.
          </Typography>
          <Typography variant="body2">
            In the absence of an API Key, contact your Installer to obtain one.
          </Typography>
          <Typography variant="body2">
            For detailed information about the API Key, refer to{" "}
            <Link href="https://apidocs.brivo.com/">
              the Brivo API documentation
            </Link>
          </Typography>
          <TextField
            value={apiKey}
            error={showError}
            helperText={
              showError
                ? "We were not able to connect to Brivo with this API key"
                : ""
            }
            FormHelperTextProps={{ sx: { position: "absolute", bottom: -20 } }}
            onChange={handleApiKeyChange}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          pr: "24px",
          pb: "20px",
        }}
      >
        <Button
          onClick={handleUpdateApiKey}
          variant="contained"
          color="secondary"
          disabled={showError || isLoading}
          sx={{ minWidth: "130px", minHeight: "40px" }}
        >
          {isLoading ? (
            <CircularProgress size={20} color="secondary" />
          ) : (
            "Update API Key"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
