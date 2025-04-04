import { Box, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export function ErrorPage() {
  const navigate = useNavigate();
  return (
    <Stack justifyContent="center" alignItems="center" minHeight="80vh" gap={6}>
      <Box textAlign="center">
        <Typography variant="h1">404</Typography>
        <Typography variant="h2">
          The page you’re looking for doesn’t exist.
        </Typography>
      </Box>
      <Button
        variant="contained"
        onClick={() => {
          navigate("/");
        }}
      >
        Back Home
      </Button>
    </Stack>
  );
}
