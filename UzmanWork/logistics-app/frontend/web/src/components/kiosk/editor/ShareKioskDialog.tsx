import { Stack } from "@mui/material";
import { ShareKioskRequest } from "coram-common-utils";
import { emailIsInvalid, EmailTextField } from "components/EmailTextField";
import { useState } from "react";
import { FormDialog } from "components/common/FormDialog";

interface ShareKioskDialogProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  kioskId: number;
  onShareKiosk: (request: ShareKioskRequest) => Promise<void>;
}

export function ShareKioskDialog({
  dialogOpen,
  setDialogOpen,
  kioskId,
  onShareKiosk,
}: ShareKioskDialogProps) {
  const [emailAddress, setEmailAddress] = useState("");

  return (
    <FormDialog
      dialogOpen={dialogOpen}
      setDialogOpen={setDialogOpen}
      dialogTitle="Share Kiosk Link"
      onSubmit={async () =>
        await onShareKiosk({
          kiosk_id: kioskId,
          recipient_email: emailAddress,
        })
      }
      isSubmitDisabled={emailIsInvalid(emailAddress) || !emailAddress}
      submitButtonText="Share"
    >
      <Stack gap={2}>
        <EmailTextField
          fullWidth
          autoFocus
          margin="dense"
          id="name"
          label="Enter Email Address"
          variant="standard"
          value={emailAddress}
          onChange={(e) => setEmailAddress(e.target.value)}
        />
      </Stack>
    </FormDialog>
  );
}
