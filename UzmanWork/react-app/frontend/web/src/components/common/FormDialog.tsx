import { Button } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import {
  DialogStatus,
  DialogRenderStatusInfo,
} from "components/common/DialogRenderStatusInfo";
import { useCallback, useState } from "react";

interface FormDialogProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  dialogTitle: string;
  children: React.ReactNode;
  onSubmit: () => Promise<void>;
  isSubmitDisabled: boolean;
  submitButtonText: string;
}

export function FormDialog({
  dialogOpen,
  setDialogOpen,
  dialogTitle,
  children,
  onSubmit,
  isSubmitDisabled,
  submitButtonText,
}: FormDialogProps) {
  const [status, setStatus] = useState<DialogStatus>(DialogStatus.INITIAL);

  const handleSubmit = useCallback(async () => {
    setStatus(DialogStatus.INITIAL);
    try {
      setStatus(DialogStatus.LOADING);
      await onSubmit();
      setStatus(DialogStatus.SUCCESS);
      // Close the dialog after some time and reset status
      setTimeout(() => setDialogOpen(false), 2000);
    } catch (e) {
      setStatus(DialogStatus.ERROR);
    }
  }, [setStatus, onSubmit, setDialogOpen]);

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
    >
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button
          disabled={isSubmitDisabled}
          onClick={async () => await handleSubmit()}
        >
          {submitButtonText}
        </Button>
        <DialogRenderStatusInfo status={status} />
      </DialogActions>
    </Dialog>
  );
}
