import { Tooltip } from "@mui/material";
import { ContentCopy as ContentCopyIcon } from "@mui/icons-material";

import { useContext, useState } from "react";
import { NotificationContext } from "contexts/notification_context";

interface CopyToClipboardProps {
  clipboardText: string;
  color?: string;
}

export default function CopyToClipboardButton({
  clipboardText,
  color = "primary",
}: CopyToClipboardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { setNotificationData } = useContext(NotificationContext);

  const copyToClipboard = async (clipboardText: string) => {
    try {
      await navigator.clipboard.writeText(clipboardText);
      setIsCopied(true);
      setNotificationData({
        message: "Copied to clipboard",
        severity: "success",
      });
      setTimeout(() => {
        setIsCopied(false);
      }, 5000);
    } catch (error) {
      setNotificationData({
        message: "Failed to copy to clipboard",
        severity: "error",
      });
    }
  };

  return (
    <Tooltip title={isCopied ? "Copied!" : "Copy info to clipboard"}>
      <ContentCopyIcon
        fontSize="small"
        sx={{
          cursor: "pointer",
          color: color,
        }}
        onClick={() => copyToClipboard(clipboardText)}
      />
    </Tooltip>
  );
}
