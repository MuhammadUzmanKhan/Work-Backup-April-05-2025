import { Typography } from "@mui/material";
import { WidgetProps } from "./types";
import { WIDGETS } from "./consts";

export function Widget(props: WidgetProps) {
  const widgetConfig = WIDGETS[props.widgetType];
  if (!widgetConfig) {
    return <Typography>Unsupported Widget</Typography>;
  }

  return <widgetConfig.Component {...props} />;
}
