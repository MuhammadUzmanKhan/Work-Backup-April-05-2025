import { Intercom as IntercomIcon } from "icons";
import { Button, Typography } from "@mui/material";
import { Stack } from "@mui/system";

export function IntercomButton({ showText }: { showText: boolean }) {
  return (
    <Button
      id="coram-intercom-launcher"
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "left",
        gap: 1,
        padding: "0",
        color: "common.white",
        minWidth: "36px",
        width: "100%",
        borderRadius: "2.5rem",
        "&:hover": {
          background: "rgba(240, 243, 251, 1)",
        },
      }}
    >
      <Stack
        sx={{
          justifyContent: "center",
          alignItems: "center",
          minWidth: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "#10b981",
          boxShadow:
            "0 1px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 32px 0 rgba(0, 0, 0, 0.16)",
          "&:hover": {
            transition: "transform 250ms cubic-bezier(0.33, 0.00, 0.00, 1.00)",
            transform: "scale(1.05)",
            background: "#10b981",
          },
        }}
      >
        <IntercomIcon viewBox="0 0 20 20" />
      </Stack>
      {showText && (
        <Typography variant="body1" color="neutral.1000">
          Support
        </Typography>
      )}
    </Button>
  );
}
