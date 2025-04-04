import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Close as CloseIcon,
  InfoOutlined as InfoOutlinedIcon,
} from "@mui/icons-material";
import DialogActions from "@mui/material/DialogActions";
import type { MouseEvent } from "react";
import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { FormInputSwitch, FormInputText } from "components/common/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AccessControlService } from "coram-common-utils";
import { NotificationContext } from "contexts/notification_context";

const ConnectAltaFormSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address.")
    .min(1, "Email is required."),
  password: z.string().min(1, "Password is required."),
  mfaCode: z.string().optional(),
  enableRemoteUnlock: z.boolean(),
});

type ConnectAltaForm = z.infer<typeof ConnectAltaFormSchema>;

interface ConnectAltaAccountDialogProps {
  open: boolean;
  onClose: VoidFunction;
}

export function ConnectAltaAccountDialog({
  open,
  onClose,
}: ConnectAltaAccountDialogProps) {
  const {
    watch,
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<ConnectAltaForm>({
    mode: "onBlur",
    resolver: zodResolver(ConnectAltaFormSchema),
    defaultValues: {
      email: "",
      password: "",
      mfaCode: "",
      enableRemoteUnlock: true,
    },
  });

  const { setNotificationData } = useContext(NotificationContext);

  const [integrationSettings, setIntegrationSettings] = useState({
    mfaEnabled: false,
  });

  function handleClose() {
    onClose();
  }

  function onSubmit(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    handleSubmit(async (data: ConnectAltaForm) => {
      try {
        await AccessControlService.authorizeAlta({
          email: data.email,
          password: data.password,
          mfa_code: integrationSettings.mfaEnabled ? data.mfaCode : undefined,
          enable_remote_unlock: data.enableRemoteUnlock,
        });
        setNotificationData({
          message: "Avigilon Alta successfully connected.",
          severity: "success",
        });
        handleClose();
      } catch (error) {
        setNotificationData({
          message:
            "Unable to connect to your account. Please verify that your email and password are entered correctly. " +
            "If your account is secured with multi-factor authentication (MFA), " +
            "ensure that the correct MFA code has been provided.",
          severity: "error",
        });
        console.error(error);
      }
    })();
  }

  const isSubmitDisabled =
    !isValid ||
    (integrationSettings.mfaEnabled && watch("mfaCode") === "") ||
    isSubmitting;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <form>
        <DialogTitle>
          <Stack
            direction="row"
            py={1}
            justifyContent="space-between"
            width="100%"
          >
            <Typography variant="h2">Integrate Avigilon Alta</Typography>
            <CloseIcon sx={{ cursor: "pointer" }} onClick={handleClose} />
          </Stack>
          <Divider sx={{ width: "100%", marginTop: "0.45rem" }} />
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 2 }}
        >
          <Typography variant="body2">
            Enter your Avigilon Alta credentials, the same ones you use to log
            in at{" "}
            <Link href="https://control.openpath.com/login" target="_blank">
              https://control.openpath.com/login
            </Link>
            , to connect your account.
          </Typography>
          <FormInputText
            name="email"
            control={control}
            placeholder="Email"
            type="email"
            fullWidth
          />
          <FormInputText
            name="password"
            control={control}
            placeholder="Password"
            type="password"
            fullWidth
          />
          <Stack gap={1}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="body2">
                Does your account have multi-factor authentication (MFA)
                enabled?
              </Typography>
              <Switch
                checked={integrationSettings.mfaEnabled}
                onChange={(e) =>
                  setIntegrationSettings((prevState) => ({
                    ...prevState,
                    mfaEnabled: e.target.checked,
                  }))
                }
              />
            </Stack>
            {integrationSettings.mfaEnabled && (
              <FormInputText
                name="mfaCode"
                control={control}
                placeholder="MFA code"
                fullWidth
              />
            )}
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography
              variant="body2"
              sx={{
                display: "flex",
                gap: 0.5,
                alignItems: "center",
              }}
            >
              Enable remote unlock for this Integration?{" "}
              <Tooltip
                title={
                  <Typography variant="body2">
                    It will create a Coram AI Integration Super Admin Alta user
                    and grant it with required permissions. <br />
                    <Link
                      href="https://openpath.readme.io/docs/create-an-openpath-bot"
                      target="_blank"
                    >
                      Check Alta documentation to learn more
                    </Link>
                  </Typography>
                }
              >
                <InfoOutlinedIcon
                  sx={{ color: "#3C3E49", fontSize: "medium" }}
                />
              </Tooltip>
              <br />
            </Typography>
            <FormInputSwitch name="enableRemoteUnlock" control={control} />
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            pr: "25px",
            pb: "20px",
          }}
        >
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            onClick={onSubmit}
            disabled={isSubmitDisabled}
            sx={{ minWidth: "160px", minHeight: "40px" }}
          >
            {isSubmitting ? (
              <CircularProgress size={20} color="secondary" />
            ) : (
              "Connect Account"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
