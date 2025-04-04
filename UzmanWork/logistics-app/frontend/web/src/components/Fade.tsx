import { Fade as FadeMui } from "@mui/material";

// Mui Fade does not support styled components in it
// see https://github.com/mui/material-ui/issues/27154
export function Fade(props: Parameters<typeof FadeMui>[0]) {
  return (
    <FadeMui {...props}>
      <div>{props.children}</div>
    </FadeMui>
  );
}
