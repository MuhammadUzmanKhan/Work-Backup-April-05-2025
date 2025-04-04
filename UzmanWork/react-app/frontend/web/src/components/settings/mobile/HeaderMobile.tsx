import { Stack } from "@mui/material";
import { BackButton } from "components/navbar/utils/BackButton";

export function HeaderMobile({ children }: { children?: React.ReactNode }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        bgcolor: "white",
        width: "100%",
        padding: "16px 36px 16px 0",
        position: "sticky",
        top: "0",
        zIndex: 1000,
        justifyContent: "space-between",
      }}
    >
      <BackButton />
      {children}
    </Stack>
  );
}
