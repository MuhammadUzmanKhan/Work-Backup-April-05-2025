import { Box, Button, Typography } from "@mui/material";
import { useLogout } from "hooks/logout";
import { useSearchParams } from "utils/search_params";

export function CallbackPage() {
  const { logoutHandler } = useLogout();

  const { searchParams } = useSearchParams();

  const error_description = searchParams.get("error_description");

  return (
    <>
      {error_description && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            minHeight: "80vh",
          }}
        >
          <Typography variant="h2" sx={{ marginBottom: 10 }}>
            {error_description === "Email not verified."
              ? "Email not verified. Please verify your email address."
              : error_description}
          </Typography>
          <Button
            variant="contained"
            onClick={async () => await logoutHandler()}
          >
            Back Home
          </Button>
        </Box>
      )}
    </>
  );
}
