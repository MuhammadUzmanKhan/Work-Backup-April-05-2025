import { Card, Stack, Tooltip, Typography } from "@mui/material";
import { forwardRef, ReactNode } from "react";
import { useIsMobile } from "components/layout/MobileOnly";
import { isDefined, RelativeTimeRange } from "coram-common-utils";
import { InfoOutlined as InfoOutlinedIcon } from "@mui/icons-material";
import { AbsoluteTimeRange } from "features/dashboard/types";
import { ReportTimeRangeSelector } from "features/dashboard/components";

const MARGIN = "10px";

interface ReportCardProps {
  reportName: string;
  reportDescription: string | undefined;
  reportTimeRange?: AbsoluteTimeRange | RelativeTimeRange;
  onTimeRangeChange?: (
    timeRange: AbsoluteTimeRange | RelativeTimeRange
  ) => void;
  Menu?: ReactNode;
  borderColour?: string;
  children: ReactNode;
}

export const ReportCard = forwardRef<HTMLDivElement, ReportCardProps>(
  function ReportCard(
    {
      reportName,
      reportDescription,
      reportTimeRange,
      onTimeRangeChange,
      Menu,
      borderColour,
      children,
    },
    ref
  ) {
    const isMobile = useIsMobile();

    const hasDescription =
      isDefined(reportDescription) && reportDescription.length > 0;

    return (
      <Card
        component={Stack}
        gap={1}
        sx={(theme) => ({
          p: "1.4rem",
          border: `1px solid ${borderColour ?? theme.palette.borderGrey.main}`,
          borderRadius: "1rem",
          minHeight: "9.5rem",
          mx: isMobile ? "0" : MARGIN,
          my: MARGIN,
        })}
        ref={ref}
      >
        <Stack direction="row" justifyContent="space-between">
          <Typography
            variant="h3"
            fontSize={20}
            py={1}
            display="flex"
            alignItems="center"
            gap={1}
          >
            {reportName}
            <Tooltip
              title={
                hasDescription
                  ? reportDescription
                  : "No description has been provided yet. Please edit the report to add a description."
              }
            >
              <InfoOutlinedIcon fontSize="small" sx={{ cursor: "help" }} />
            </Tooltip>
          </Typography>
          <Stack direction="row" gap={2} alignItems="center">
            {isDefined(reportTimeRange) && (
              <ReportTimeRangeSelector
                variant="standard"
                initialTimeRange={reportTimeRange}
                onTimeRangeChange={onTimeRangeChange}
              />
            )}
            {isDefined(Menu) && Menu}
          </Stack>
        </Stack>
        {children}
      </Card>
    );
  }
);
