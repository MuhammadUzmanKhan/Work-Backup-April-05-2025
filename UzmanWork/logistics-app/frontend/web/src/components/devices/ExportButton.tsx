import { LoadingButton } from "@mui/lab";
import { Typography } from "@mui/material";
import { NotificationContext } from "contexts/notification_context";
import { ExportMenu } from "icons/export-menu";
import { useContext } from "react";
import { useMutation } from "react-query";
import { downloadLocalFile } from "utils/file_save";

export interface ExportConfig {
  exportFn: () => Promise<string>;
  exportName: () => string;
  exportFormat: "csv";
  mimeType: "text/csv";
}

interface ExportButtonProps {
  exportConfig: ExportConfig;
}

export function ExportButton({ exportConfig }: ExportButtonProps) {
  const { setNotificationData } = useContext(NotificationContext);

  const { isLoading, mutateAsync: handleExport } = useMutation(
    async () => {
      const csvString = await exportConfig.exportFn();
      downloadLocalFile(
        csvString,
        `${exportConfig.exportName()}.${exportConfig.exportFormat}`,
        exportConfig.mimeType
      );
    },
    {
      onError: () => {
        setNotificationData({
          severity: "error",
          message: "Failed to export data",
        });
      },
    }
  );

  return (
    <LoadingButton
      loading={isLoading}
      onClick={async () => await handleExport()}
      color="info"
      variant="outlined"
      startIcon={<ExportMenu fontSize="small" />}
      sx={{
        borderRadius: "4px",
        py: 0,
      }}
    >
      <Typography variant="body2">Export</Typography>
    </LoadingButton>
  );
}
