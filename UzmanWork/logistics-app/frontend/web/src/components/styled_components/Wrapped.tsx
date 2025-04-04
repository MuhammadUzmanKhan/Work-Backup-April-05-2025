import { Typography } from "@mui/material";
import { wrapTextStyle } from "components/devices/utils";

export function Wrapped(props: Parameters<typeof Typography>[0]) {
  return <Typography sx={{ ...wrapTextStyle }} {...props} />;
}
