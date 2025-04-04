import { Box, Typography } from "@mui/material";
import { WallSkeleton } from "components/personal_wall/utils/WallSkeleton";
import { useKioskAndInitialWall, useReloadOnOutdatedKiosk } from "hooks/kiosk";
import {
  Kiosk,
  KioskPublicService,
  VideoResRequestType,
  isDefined,
  getStaticResolutionConfig,
} from "coram-common-utils";
import { Duration } from "luxon";
import { StaticKioskView } from "components/kiosk/public/StaticKioskView";
import { RotatingKioskView } from "components/kiosk/public/RotatingKioskView";
import { useMemo } from "react";
import { StringParam, withValidatedPathParams } from "common/utils";
import { z } from "zod";

// NOTE(@lberg): this enable or disable the use of WebRTC for the kiosk.
const PREFER_WEBRTC = false;

function isStaticKiosk(kiosk: Kiosk) {
  return kiosk.rotate_frequency_s === 0 || kiosk.walls.length === 1;
}

const PublicKioskPagePathParamsSchema = z.object({
  kioskHash: StringParam,
});

type PublicKioskPagePathParams = z.infer<
  typeof PublicKioskPagePathParamsSchema
>;

function PublicKioskPageImpl({ kioskHash }: PublicKioskPagePathParams) {
  // if we detect that the frontend version is outdated, reload the page
  useReloadOnOutdatedKiosk();

  const resolutionConfig = useMemo(
    () => getStaticResolutionConfig(VideoResRequestType.LOW),
    []
  );

  const { kiosk, initialWall, isErrorKiosk, isErrorInitialWall } =
    useKioskAndInitialWall(
      kioskHash,
      resolutionConfig,
      Duration.fromObject({ seconds: 10 }).as("milliseconds")
    );

  if (isErrorKiosk) {
    return (
      <Typography variant="h3" align="center">
        {`Kiosk ${kioskHash} not found.`}
      </Typography>
    );
  }

  if (isErrorInitialWall) {
    return (
      <Typography variant="h3" align="center">
        {`Error while fetching wall.`}
      </Typography>
    );
  }

  return (
    <Box height="100vh" overflow="hidden">
      {isDefined(kiosk) && isDefined(initialWall) ? (
        isStaticKiosk(kiosk.kiosk) ? (
          <StaticKioskView
            kioskName={kiosk.kiosk.name}
            kioskHash={kioskHash}
            wall={initialWall}
            resolutionConfig={resolutionConfig}
            preferWebRTC={PREFER_WEBRTC}
          />
        ) : (
          <RotatingKioskView
            kioskName={kiosk.kiosk.name}
            kioskHash={kioskHash}
            rotationFrequencyS={kiosk.kiosk.rotate_frequency_s}
            firstWall={initialWall}
            resolutionConfig={resolutionConfig}
            onPublicKioskNextWall={KioskPublicService.publicKioskNextWall}
            preferWebRTC={PREFER_WEBRTC}
          />
        )
      ) : (
        <WallSkeleton />
      )}
    </Box>
  );
}

export const PublicKioskPage = withValidatedPathParams(
  PublicKioskPageImpl,
  PublicKioskPagePathParamsSchema
);
