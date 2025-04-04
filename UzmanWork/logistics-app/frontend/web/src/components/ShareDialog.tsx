import { useContext, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  ContentPaste as ContentPasteIcon,
} from "@mui/icons-material";
import { NotificationContext } from "contexts/notification_context";
import { emailIsValid } from "./EmailTextField";
import { MultiEmailTextField } from "./MutliEmailTextField";
import { getEmailsInStorage, setEmailsInStorage } from "utils/session_storage";

interface ShareDialogProps {
  shareOpen: boolean;
  setShareOpen: (open: boolean) => void;
  refetch?: () => void;
  onShare: (emails: string[]) => Promise<void>;
  title: string;
  text: string;
  successMessage: (emails: string[]) => string;
  errorMessage: (e: unknown) => string;
}

export interface ShareWithEmails {
  // Emails to share object with (which were "finished" via a special key).
  finalizedEmails: string[];
  // In addition, keep track of email currently being submitted s.t. we can share
  // before hitting any of the special keys.
  currentEmail: string;
}

const EMPTY_SHARE_WITH_EMAILS: ShareWithEmails = {
  finalizedEmails: [],
  currentEmail: "",
};

function getAllShareWithEmails(shareWithEmails: ShareWithEmails) {
  return emailIsValid(shareWithEmails.currentEmail)
    ? shareWithEmails.finalizedEmails.concat([shareWithEmails.currentEmail])
    : shareWithEmails.finalizedEmails;
}

function areShareEmailsValid(shareWithEmails: ShareWithEmails) {
  return (
    (shareWithEmails.finalizedEmails.length > 0 &&
      (shareWithEmails.currentEmail.length == 0 ||
        emailIsValid(shareWithEmails.currentEmail))) ||
    emailIsValid(shareWithEmails.currentEmail)
  );
}

// Component to share a generic object with a list of email recipients
export default function ShareDialog({
  shareOpen,
  setShareOpen,
  refetch,
  onShare,
  title,
  text,
  successMessage,
  errorMessage,
}: ShareDialogProps) {
  const [shareWithEmails, setShareWithEmails] = useState<ShareWithEmails>(
    EMPTY_SHARE_WITH_EMAILS
  );
  const [loading, setLoading] = useState<boolean>(false);
  const { setNotificationData } = useContext(NotificationContext);
  const [pasteEnabled, setPasteEnabled] = useState(false);
  const emailCandidates = getEmailsInStorage();

  // To real-time updates of paste button state
  useEffect(() => {
    function clipboardContainsEmails() {
      setPasteEnabled(
        emailCandidates.filter(
          (emailCandidate) =>
            emailCandidate.length > 0 && emailIsValid(emailCandidate)
        ).length > 0
      );
    }
    clipboardContainsEmails();
  }, [emailCandidates]);

  async function share() {
    try {
      setLoading(true);
      const allShareWithEmails = getAllShareWithEmails(shareWithEmails);
      await onShare(allShareWithEmails);
      setShareOpen(false);
      setShareWithEmails(EMPTY_SHARE_WITH_EMAILS);
      if (refetch) {
        refetch();
      }
      setNotificationData({
        message: successMessage(allShareWithEmails),
        severity: "success",
      });
    } catch (e) {
      setNotificationData({
        message: errorMessage(e),
        severity: "error",
      });
      console.error(e);
    }
    setTimeout(() => setLoading(false), 1000);
  }

  const sharingEnabled = !loading && areShareEmailsValid(shareWithEmails);

  function copyEmails() {
    const allShareEmails = getAllShareWithEmails(shareWithEmails);
    setEmailsInStorage(allShareEmails);
    setPasteEnabled(true);
    setNotificationData({
      message:
        "Successfully copied " +
        allShareEmails.length +
        (allShareEmails.length == 1 ? " email " : " emails ") +
        " to clipboard",
      severity: "success",
    });
  }

  function pasteEmails() {
    const emailCandidates = getEmailsInStorage();
    const pastedEmails = emailCandidates.filter(
      (emailCandidate) =>
        emailCandidate.length > 0 && emailIsValid(emailCandidate)
    );
    setShareWithEmails({ finalizedEmails: pastedEmails, currentEmail: "" });
    setNotificationData({
      message:
        "Successfully pasted " +
        pastedEmails.length +
        (pastedEmails.length == 1 ? " email " : " emails ") +
        " from clipboard",
      severity: "success",
    });
  }

  return (
    <Dialog
      fullWidth
      open={shareOpen}
      onClose={() => {
        setShareOpen(false);
        setShareWithEmails(EMPTY_SHARE_WITH_EMAILS);
      }}
    >
      <DialogTitle>
        <Stack
          direction="row"
          py={1}
          justifyContent="space-between"
          width="100%"
        >
          <Typography variant="h3">{title}</Typography>
          <CloseIcon
            sx={{ cursor: "pointer" }}
            onClick={() => setShareOpen(false)}
          />
        </Stack>
        <Divider sx={{ width: "100%", marginTop: "0.45rem" }} />
      </DialogTitle>
      <DialogContent>
        <Stack alignItems="center">
          <MultiEmailTextField
            fullWidth
            autoFocus
            margin="dense"
            setShareWithEmails={setShareWithEmails}
            shareWithEmails={shareWithEmails}
          />
          <Typography variant="body2" sx={{ paddingTop: 1, paddingBottom: 1 }}>
            {text}
          </Typography>
          <Stack
            direction="row"
            alignSelf="stretch"
            justifyContent="center"
            position="relative"
            alignItems="center"
          >
            <Button
              disabled={!sharingEnabled}
              variant="contained"
              color="secondary"
              onClick={share}
            >
              Share
            </Button>
            <Stack position="absolute" right={0} direction="row" gap={2}>
              <Tooltip title="Copy emails to clipboard">
                <Button
                  disabled={!sharingEnabled}
                  variant="contained"
                  color="secondary"
                  sx={{
                    minWidth: "24px",
                  }}
                  onClick={copyEmails}
                >
                  <ContentCopyIcon sx={{ width: "20px" }} />
                </Button>
              </Tooltip>
              <Tooltip title="Paste emails from clipboard">
                <Button
                  disabled={!pasteEnabled}
                  variant="contained"
                  color="secondary"
                  sx={{
                    minWidth: "24px",
                    paddingX: "8px",
                  }}
                  onClick={pasteEmails}
                >
                  <ContentPasteIcon sx={{ width: "20px" }} />
                </Button>
              </Tooltip>
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
