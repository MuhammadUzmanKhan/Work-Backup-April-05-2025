import { Box, Chip, Divider, Fade, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";

export function KioskChip({ label }: { label: string | ReactNode }) {
  return (
    <Chip
      color="secondary"
      label={label}
      sx={{
        height: "auto",
        opacity: 0.6,
        paddingY: "0.5rem",
      }}
    />
  );
}

export function KioskOverlayMenu({
  show,
  children,
}: {
  show: boolean;
  children: ReactNode;
}) {
  return (
    <Fade in={show} timeout={500}>
      <Box position="fixed" right="15px" bottom="15px">
        {children}
      </Box>
    </Fade>
  );
}

export function StaticKioskChip({
  kioskName,
  currentWallName,
}: {
  kioskName: string;
  currentWallName: string;
}) {
  return (
    <KioskChip
      label={
        <Stack direction="row" gap={1}>
          <Stack direction="row" alignItems="end" gap={0.25}>
            <Typography variant="body2">Kiosk Name: </Typography>
            <Typography variant="body1">{kioskName}</Typography>
          </Stack>
          <Divider orientation="vertical" flexItem />
          <Stack direction="row" alignItems="end" gap={0.25}>
            <Typography variant="body2">Wall Name: </Typography>
            <Typography variant="body1">{currentWallName}</Typography>
          </Stack>
        </Stack>
      }
    />
  );
}

export function RotatingKioskChip({
  kioskName,
  currentWallName,
  timeLeftS,
}: {
  kioskName: string;
  currentWallName: string;
  timeLeftS: number;
}) {
  return (
    <KioskChip
      label={
        <Stack>
          <Stack direction="row" gap={1}>
            <Stack direction="row" alignItems="end" gap={0.25}>
              <Typography variant="body2">Kiosk Name: </Typography>
              <Typography variant="body1">{kioskName}</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem />
            <Stack direction="row" alignItems="end" gap={0.25}>
              <Typography variant="body2">Wall Name: </Typography>
              <Typography variant="body1">{currentWallName}</Typography>
            </Stack>
          </Stack>

          <Stack direction="row" alignItems="end" gap={1}>
            <Typography variant="body2">Rotating in: </Typography>
            <Typography variant="body1">{timeLeftS}s</Typography>
          </Stack>
        </Stack>
      }
    />
  );
}
