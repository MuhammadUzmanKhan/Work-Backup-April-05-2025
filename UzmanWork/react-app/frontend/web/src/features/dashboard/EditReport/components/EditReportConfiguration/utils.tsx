import {
  isClientActivityInRegionConfiguration,
  isClientLineCrossingConfiguration,
  isClientObjectCountConfiguration,
  ReportConfiguration,
} from "features/dashboard/types";
import { EditReportConfigurationProps } from "./types";
import { ReactElement } from "react";
import { EditActivityInRegionReportConfiguration } from "./EditActivityInRegionReportConfiguration";
import { EditLineCrossingReportConfiguration } from "./EditLineCrossingReportConfiguration";
import { EditObjectCountReportConfiguration } from "./EditObjectCountReportConfiguration";
import { Typography } from "@mui/material";

export function getEditReportConfigurationComponent({
  configuration,
  ...rest
}: EditReportConfigurationProps<ReportConfiguration>): ReactElement {
  if (isClientActivityInRegionConfiguration(configuration)) {
    return (
      <EditActivityInRegionReportConfiguration
        configuration={configuration}
        {...rest}
      />
    );
  } else if (isClientLineCrossingConfiguration(configuration)) {
    return (
      <EditLineCrossingReportConfiguration
        configuration={configuration}
        {...rest}
      />
    );
  } else if (isClientObjectCountConfiguration(configuration)) {
    return (
      <EditObjectCountReportConfiguration
        configuration={configuration}
        {...rest}
      />
    );
  }

  console.error("Unknown report configuration", configuration);
  return <Typography>Unsupported Report</Typography>;
}
