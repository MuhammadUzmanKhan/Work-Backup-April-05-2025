import {
  Checkbox,
  Dialog,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { Duration } from "luxon";
import {
  CameraResponse,
  SharedVideosService,
  getTimezoneFromCamera,
} from "coram-common-utils";
import { PanelDateTimePickers } from "./timeline/common_panel/PanelDateTimePickers";
import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";
import { useTimeIntervalUpdater } from "hooks/useVideoTimeUpdater";
import {
  INITIAL_ERROR_STATE,
  PanelSubmitButton,
} from "./timeline/common_panel/PanelSubmitButton";
import { formatDateTime } from "utils/dates";
import { EmailTextField, emailIsInvalid } from "./EmailTextField";
import { PhoneNumberTextField, phoneIsInvalid } from "./PhoneNumberTextField";
import {
  CustomDurationPicker,
  ExpirationDurState,
} from "./timeline/common_panel/CustomDurationPicker";
import { MessageField } from "./MessageField";
import { TimeInterval } from "utils/time";

// Max time we can share in minutes
const MAX_SHARE_DURATION = Duration.fromObject({
  minutes: 30,
});

interface ShareCreateDialogProps {
  open: boolean;
  clipTimeInterval: TimeInterval | null;
  onCloseClick: VoidFunction;
  currentStream: CameraResponse;
}

export function ShareCreateDialog({
  open,
  clipTimeInterval,
  onCloseClick,
  currentStream,
}: ShareCreateDialogProps) {
  const [formData, setFormData] = useState({
    emailAddress: "",
    phoneNumber: "",
    userMessage: "",
  });

  const { user } = useAuth0();
  const timezone = getTimezoneFromCamera(currentStream);
  const { timeInterval, setStartTime, setEndTime } = useTimeIntervalUpdater(
    clipTimeInterval,
    timezone
  );
  const [shareLive, setShareLive] = useState(false);

  const [errors, setErrors] = useState(INITIAL_ERROR_STATE);
  const [expirationDur, setExpirationDur] = useState<ExpirationDurState>({
    value: 1,
    unit: "hours",
  });

  // Add a function to handle form data changes
  const handleFormDataChange = (field: string, value: string) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [field]: value,
    }));
  };

  // Send share link creation request
  async function handleSend(
    emailAddress: string,
    phoneNumber: string,
    userMessage: string
  ) {
    if (user?.name === undefined) {
      throw new Error("User is not properly set up");
    }

    if (emailAddress.length === 0 && phoneNumber.length === 0) {
      throw new Error("Neither phone number and email address are specified!");
    }

    const userMessageTrimmed = userMessage.trim();
    const expireSeconds = Duration.fromObject({
      [expirationDur.unit]: expirationDur.value,
    }).as("seconds");

    const share_video_request = {
      expiration_seconds: expireSeconds,
      email_address: emailAddress.length > 0 ? emailAddress : undefined,
      phone_number: phoneNumber.length > 0 ? phoneNumber : undefined,
      user_name: user.name,
      mac_address: currentStream.camera.mac_address,
      message: userMessageTrimmed.length > 0 ? userMessageTrimmed : undefined,
    };

    if (shareLive) {
      await SharedVideosService.shareLiveVideo(share_video_request);
      return;
    }

    await SharedVideosService.addSharedVideo({
      ...share_video_request,
      start_time: formatDateTime(timeInterval.timeStart),
      end_time: formatDateTime(timeInterval.timeEnd),
    });
  }

  const isButtonDisabled = () => {
    if (
      emailIsInvalid(formData.emailAddress) ||
      phoneIsInvalid(formData.phoneNumber)
    ) {
      return true;
    }
    if (
      formData.emailAddress.length === 0 &&
      formData.phoneNumber.length === 0
    ) {
      return true;
    }
    if (errors.isStartTimeInvalid || (errors.isEndTimeInvalid && !shareLive)) {
      return true;
    }
    return false;
  };

  return (
    <Dialog onClose={onCloseClick} open={open}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        p="1rem"
      >
        <Typography variant="h3">Share</Typography>
        <IconButton onClick={onCloseClick} sx={{ p: 0 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Divider />
      <Stack
        sx={{
          justifyContent: "space-between",
          gap: "1rem",
          p: "1.25rem 1rem",
          minHeight: "29rem",
        }}
      >
        <PanelDateTimePickers
          timezone={timezone}
          startTime={timeInterval.timeStart}
          endTime={timeInterval.timeEnd}
          setStartTime={setStartTime}
          setEndTime={setEndTime}
          errors={errors}
          setErrors={setErrors}
          maxDurationBetweenStartAndEndTime={MAX_SHARE_DURATION}
          maxDurationBetweenStartAndEndTimeText="download duration"
          direction="row"
          disabled={shareLive}
          textFieldProps={{
            sx: { padding: "2px", borderRadius: 0 },
          }}
        />
        <FormControlLabel
          sx={{ m: 0, gap: "0.62rem" }}
          control={
            <Checkbox
              size="small"
              checked={shareLive}
              onChange={(e) => setShareLive(e.target.checked)}
              sx={{ p: 0 }}
              color="secondary"
            />
          }
          label={<Typography variant="body2">Share Live Stream</Typography>}
        />
        <CustomDurationPicker
          title="Shared Link Expiry"
          options={["hours", "days", "weeks"]}
          expirationDur={expirationDur}
          setExpirationDur={setExpirationDur}
        />
        <PhoneNumberTextField
          fullWidth
          value={formData.phoneNumber}
          onChange={(val) => handleFormDataChange("phoneNumber", val)}
          size="small"
          placeholder="Mobile (Optional)"
          sx={{
            "& .MuiOutlinedInput-root": {
              p: 0,
            },
          }}
        />
        <EmailTextField
          fullWidth
          size="small"
          id="name"
          label="Email Address"
          variant="outlined"
          value={formData.emailAddress}
          onChange={(e) => handleFormDataChange("emailAddress", e.target.value)}
        />
        <MessageField
          size="small"
          userMessage={formData.userMessage}
          setUserMessage={(val) => handleFormDataChange("userMessage", val)}
        />

        <PanelSubmitButton
          errors={errors}
          setErrors={setErrors}
          processClickCb={async () => {
            await handleSend(
              formData.emailAddress,
              formData.phoneNumber,
              formData.userMessage
            );
          }}
          buttonTextCb={(isLoading: boolean) =>
            isLoading ? "Sharing" : "Share"
          }
          isDisabled={isButtonDisabled()}
          sx={{
            py: "0.75rem",
          }}
        />
      </Stack>
    </Dialog>
  );
}
