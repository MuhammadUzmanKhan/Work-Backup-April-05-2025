import { Box, Checkbox, Stack, TextField, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { CandidateCamera } from "features/camera_registration/types";

interface CameraRegistrationItemMobileProps {
  candidate: CandidateCamera;
  onCameraToggle: (macAddress: string) => void;
  onCameraUsernameChange: (macAddress: string, username: string) => void;
  onCameraPasswordChange: (macAddress: string, password: string) => void;
}

export function CameraRegistrationItemMobile({
  candidate,
  onCameraToggle,
  onCameraUsernameChange,
  onCameraPasswordChange,
}: CameraRegistrationItemMobileProps) {
  return (
    <Grid container spacing={1} p={0}>
      <Grid xs={1} px={0}>
        <Checkbox
          color="secondary"
          checked={candidate.selected}
          onChange={() => onCameraToggle(candidate.data.mac_address)}
          sx={{ p: 0 }}
        />
      </Grid>
      <Grid xs={5.5}>
        <Stack gap={0.75} minHeight="90px" justifyContent="space-between">
          <Typography variant="body2" gap={1} display="flex">
            <Box component="span" color="text.secondary">
              Camera:
            </Box>
            <Box component="span" color="text.primary">
              {candidate.idx}
            </Box>
          </Typography>
          <Typography variant="body2" gap={1} display="flex">
            <Box component="span" color="text.secondary">
              IP Address:
            </Box>
            <Box
              component="span"
              color="text.primary"
              sx={{ wordBreak: "break-all" }}
            >
              {candidate.data.ip}
            </Box>
          </Typography>
          <TextField
            placeholder="Username"
            variant="outlined"
            value={candidate.data.username ?? ""}
            sx={{ input: { p: "6.5px" } }}
            onChange={(e) =>
              onCameraUsernameChange(candidate.data.mac_address, e.target.value)
            }
          />
        </Stack>
      </Grid>
      <Grid xs={5.5}>
        <Stack gap={0.75} minHeight="90px" justifyContent="space-between">
          <Typography variant="body2" gap={1} display="flex">
            <Box component="span" color="text.secondary">
              Vendor:
            </Box>
            <Box component="span" color="text.primary">
              {candidate.data.vendor}
            </Box>
          </Typography>
          <Typography variant="body2" gap={0.5} display="flex">
            <Box component="span" color="text.secondary">
              Mac Add:
            </Box>
            <Box
              component="span"
              color="text.primary"
              sx={{
                wordBreak: "break-all",
              }}
            >
              {candidate.data.mac_address}
            </Box>
          </Typography>
          <TextField
            placeholder="Password"
            variant="outlined"
            value={candidate.data.password ?? ""}
            sx={{ input: { p: "6.5px" } }}
            onChange={(e) =>
              onCameraPasswordChange(candidate.data.mac_address, e.target.value)
            }
          />
        </Stack>
      </Grid>
    </Grid>
  );
}
