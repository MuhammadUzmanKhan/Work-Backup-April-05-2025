import {
  KioskNextWallRequest,
  KioskWallResponse,
  PublicCameraData,
  StaticResolutionConfig,
  isDefined,
} from "coram-common-utils";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { KioskWall } from "./KioskWall";
import {
  RotatingKioskState,
  useKeepKioskNextWallAlive,
  useTrackTimeUntilNextWall,
} from "hooks/kiosk";
import { KioskOverlayMenu, RotatingKioskChip } from "./KioskChip";
import { NotificationContext } from "contexts/notification_context";
import { Duration } from "luxon";
import { FullScreenButton } from "components/FullScreenButton";
import { Box, Stack } from "@mui/material";

const EARLY_FETCH_NEXT_WALL_TIME = Duration.fromObject({ seconds: 6 });

interface RotatingKioskViewProps {
  kioskName: string;
  kioskHash: string;
  rotationFrequencyS: number;
  firstWall: KioskWallResponse;
  resolutionConfig: StaticResolutionConfig;
  onPublicKioskNextWall: (
    kioskHash: string,
    request: KioskNextWallRequest
  ) => Promise<KioskWallResponse>;
  preferWebRTC: boolean;
}

export function RotatingKioskView({
  kioskName,
  kioskHash,
  rotationFrequencyS,
  firstWall,
  resolutionConfig,
  onPublicKioskNextWall,
  preferWebRTC,
}: RotatingKioskViewProps) {
  const [isHover, setIsHover] = useState(false);
  const wallRef = useRef<HTMLDivElement>(null);

  const { setNotificationData } = useContext(NotificationContext);
  const [kioskCurrentWall, setKioskCurrentWall] =
    useState<KioskWallResponse>(firstWall);
  const [kioskNextWall, setKioskNextWall] =
    useState<KioskWallResponse>(firstWall);
  const { rotateTimeLeftS, resetTimeLeft } =
    useTrackTimeUntilNextWall(rotationFrequencyS);
  const [rotatingKioskState, setRotatingKioskState] =
    useState<RotatingKioskState>(RotatingKioskState.RequireNextKioskFetch);

  const fetchWhenTimeLeftS = EARLY_FETCH_NEXT_WALL_TIME.as("seconds");

  // Fetch the next wall.
  useEffect(() => {
    if (
      rotatingKioskState !== RotatingKioskState.RequireNextKioskFetch ||
      rotateTimeLeftS > fetchWhenTimeLeftS
    ) {
      return;
    }

    onPublicKioskNextWall(kioskHash, {
      current_wall_id: kioskCurrentWall.wall.id,
      resolution_config: resolutionConfig,
    })
      .then((nextWall) => {
        setKioskNextWall(nextWall);
        setRotatingKioskState(RotatingKioskState.RequireNextKioskRender);
      })
      .catch((err) => {
        console.error(err);
        setNotificationData({
          message: "Error fetching next wall",
          severity: "error",
          props: {
            autoHideDuration: 2500,
          },
        });
        resetTimeLeft();
        setRotatingKioskState(RotatingKioskState.RequireNextKioskFetch);
      });
  }, [
    fetchWhenTimeLeftS,
    kioskCurrentWall.wall.id,
    kioskHash,
    resetTimeLeft,
    resolutionConfig,
    rotatingKioskState,
    setNotificationData,
    rotateTimeLeftS,
    onPublicKioskNextWall,
  ]);

  // Render the next wall.
  useEffect(() => {
    if (
      rotatingKioskState !== RotatingKioskState.RequireNextKioskRender ||
      rotateTimeLeftS > 0
    ) {
      return;
    }
    setKioskCurrentWall(kioskNextWall);
    resetTimeLeft();
    setRotatingKioskState(RotatingKioskState.RequireNextKioskFetch);
  }, [
    kioskNextWall,
    setKioskCurrentWall,
    rotateTimeLeftS,
    resetTimeLeft,
    rotatingKioskState,
  ]);

  // Keep also the next wall alive when we are ready to render it.
  const nextWallCameras = useMemo(
    () =>
      kioskNextWall.wall_tiles
        .map((tile) => tile.camera_data)
        .filter((camera): camera is PublicCameraData => isDefined(camera)),
    [kioskNextWall.wall_tiles]
  );
  useKeepKioskNextWallAlive(
    kioskHash,
    kioskNextWall.wall.id,
    nextWallCameras,
    resolutionConfig,
    rotatingKioskState === RotatingKioskState.RequireNextKioskRender
  );

  return (
    <Box
      height="100%"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <KioskWall
        ref={wallRef}
        resolutionConfig={resolutionConfig}
        kioskHash={kioskHash}
        wall={kioskCurrentWall.wall}
        cameras={kioskCurrentWall.wall_tiles
          .map((tile) => tile.camera_data)
          .filter((camera): camera is PublicCameraData => isDefined(camera))}
        tiles={kioskCurrentWall.wall_tiles.map((tile) => tile.wall_tile)}
        preferWebRTC={preferWebRTC}
      />
      <KioskOverlayMenu show={isHover}>
        <Stack direction="row" gap={2} alignItems="center">
          <RotatingKioskChip
            kioskName={kioskName}
            timeLeftS={rotateTimeLeftS}
            currentWallName={kioskCurrentWall.wall.name}
          />
          <FullScreenButton targetElement={wallRef.current} />
        </Stack>
      </KioskOverlayMenu>
    </Box>
  );
}
