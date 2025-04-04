import { Box, Button, debounce, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import {
  DashboardReport,
  DashboardReportMetadata,
  DashboardResponse,
} from "features/dashboard/types";
import {
  EditReportConfiguration,
  EditReportDetails,
  ReportBreadcrumbs,
  SelectReportWidget,
} from "./components";
import { useSaveReport } from "features/dashboard/hooks";
import { useNavigate } from "react-router-dom";
import { TOOLBAR_HEIGHT_PX } from "components/navbar/navbar";
import { getReportWidth } from "./utils";
import Grid from "@mui/material/Unstable_Grid2";
import { LoadingButton } from "@mui/lab";
import { useReportDataPreview } from "./hooks";
import { ReportCard, Widget } from "../components";
import { confirm } from "utils/confirm";
import { PathNames } from "hooks/usePageNavigation";
import { isDefined } from "coram-common-utils";

interface EditReportProps {
  dashboard: DashboardResponse;
  report: DashboardReport;
}

export function EditReport({ dashboard, report }: EditReportProps) {
  const navigate = useNavigate();

  const [editReportState, setEditReportState] = useState(report);

  const { isLoading: isSaving, mutateAsync: saveReport } = useSaveReport();

  const [hasChanges, setHasChanges] = useState(false);

  const {
    data: reportData,
    isFetching: isFetchingPreviewData,
    refetch: refetchPreviewData,
  } = useReportDataPreview(editReportState);

  function handleUpdateReport(update: Partial<DashboardReport>) {
    setEditReportState({ ...editReportState, ...update });
    setHasChanges(true);
  }

  const debouncedRefetchPreviewData = useMemo(
    () => debounce(async () => await refetchPreviewData(), 1000),
    [refetchPreviewData]
  );

  function handleUpdateReportMetadataAndRefetchPreviewData(
    update: Partial<DashboardReportMetadata>
  ) {
    handleUpdateReport({
      report_metadata: {
        ...editReportState.report_metadata,
        ...update,
      },
    });
    debouncedRefetchPreviewData();
  }

  async function goBackHandler() {
    if (hasChanges) {
      const isConfirmed = await confirm({
        confirmText:
          "You have unsaved changes. Are you sure you want to go back?",
        yesText: "Go Back",
        noText: "Continue Editing",
      });
      if (!isConfirmed) {
        return;
      }
    }

    navigate(`${PathNames.INSIGHTS}/${dashboard.id}`);
  }

  const reportType = editReportState.report_metadata.configuration.report_type;

  return (
    <Grid
      container
      height={`calc(100vh - ${TOOLBAR_HEIGHT_PX}px)`}
      bgcolor="white"
    >
      <Grid xs={6} height="100%">
        <Stack p={2} gap={2} height="100%">
          <ReportBreadcrumbs
            dashboardId={dashboard.id}
            dashboardTitle={dashboard.title}
            reportId={report.id}
            reportName={report.name}
          />
          <Box pr={4} overflow="auto">
            <Stack gap={2} overflow="auto">
              <EditReportDetails
                editedReportState={editReportState}
                onUpdateReport={handleUpdateReport}
                onUpdateReportMetadata={
                  handleUpdateReportMetadataAndRefetchPreviewData
                }
              />
              <EditReportConfiguration
                configuration={editReportState.report_metadata.configuration}
                onConfigurationChange={(configuration) =>
                  handleUpdateReportMetadataAndRefetchPreviewData({
                    configuration,
                  })
                }
              />
              {isDefined(reportType) && (
                <SelectReportWidget
                  reportType={reportType}
                  widgetType={editReportState.report_metadata.widget_type}
                  onWidgetSelect={(widgetType) =>
                    handleUpdateReport({
                      ...editReportState,
                      report_metadata: {
                        ...editReportState.report_metadata,
                        widget_type: widgetType,
                        width: getReportWidth(widgetType),
                      },
                    })
                  }
                />
              )}
            </Stack>
          </Box>
          <Stack pt={2} direction="row" gap={2}>
            <Button
              variant="outlined"
              onClick={goBackHandler}
              sx={{
                borderColor: "text.primary",
                color: "text.primary",
              }}
            >
              Go Back
            </Button>
            <LoadingButton
              variant="contained"
              color="secondary"
              onClick={async () => {
                await saveReport(editReportState);
                navigate(`${PathNames.INSIGHTS}/${dashboard.id}`);
              }}
              loading={isSaving}
            >
              Save Report
            </LoadingButton>
          </Stack>
        </Stack>
      </Grid>
      <Grid xs={6} borderLeft="1px solid #E6EBF2" bgcolor="#EFF0F1">
        <Stack position="sticky" top="0" p={1}>
          <Typography variant="h2" color="text.primary" p={2} pb={1}>
            Preview
          </Typography>
          <ReportCard
            reportName={editReportState.name}
            reportDescription={editReportState.description}
          >
            <Widget
              reportName={editReportState.name}
              widgetType={editReportState.report_metadata.widget_type}
              isDataReady={!isFetchingPreviewData}
              data={reportData}
            />
          </ReportCard>
        </Stack>
      </Grid>
    </Grid>
  );
}
