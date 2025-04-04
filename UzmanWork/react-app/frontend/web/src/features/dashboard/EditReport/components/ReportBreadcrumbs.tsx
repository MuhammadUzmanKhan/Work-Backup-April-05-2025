import { StyledBreadcrumbs } from "components/styled_components/StyledBreadcrumbs";
import { PathNames } from "hooks/usePageNavigation";

interface ReportBreadcrumbsProps {
  dashboardId: number;
  dashboardTitle: string;
  reportId: number;
  reportName: string;
}

export function ReportBreadcrumbs({
  dashboardId,
  dashboardTitle,
  reportId,
  reportName,
}: ReportBreadcrumbsProps) {
  return (
    <StyledBreadcrumbs
      breadcrumbs={[
        {
          to: PathNames.INSIGHTS,
          label: "Insights",
        },
        {
          to: `${PathNames.INSIGHTS}/${dashboardId}`,
          label: dashboardTitle,
        },
        {
          to: `${PathNames.INSIGHTS}/${dashboardId}/report/${reportId}`,
          label: reportName,
        },
      ]}
    />
  );
}
