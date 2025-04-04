import { Stack } from "@mui/material";

export function CenteredStack(props: Parameters<typeof Stack>[0]) {
  return (
    <Stack
      {...props}
      sx={{
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
        maxWidth: "100vw",
        ...props.sx,
      }}
    />
  );
}
