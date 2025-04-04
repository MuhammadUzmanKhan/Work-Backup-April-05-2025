import {
  KioskWallResponse,
  PublicCameraData,
  StaticResolutionConfig,
  isDefined,
} from "coram-common-utils";
import { KioskWall } from "./KioskWall";
import { KioskOverlayMenu, StaticKioskChip } from "./KioskChip";
import { FullScreenButton } from "components/FullScreenButton";
import { Box, Stack } from "@mui/material";
import { useRef, useState } from "react";

interface StaticKioskViewProps {
  kioskName: string;
  kioskHash: string;
  wall: KioskWallResponse;
  resolutionConfig: StaticResolutionConfig;
  preferWebRTC: boolean;
}

export function StaticKioskView({
  kioskName,
  kioskHash,
  wall,
  resolutionConfig,
  preferWebRTC,
}: StaticKioskViewProps) {
  const [isHover, setIsHover] = useState(false);
  const wallRef = useRef<HTMLDivElement>(null);

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
        wall={wall.wall}
        cameras={wall.wall_tiles
          .map((tile) => tile.camera_data)
          .filter((camera): camera is PublicCameraData => isDefined(camera))}
        tiles={wall.wall_tiles.map((tile) => tile.wall_tile)}
        preferWebRTC={preferWebRTC}
      />
      <KioskOverlayMenu show={isHover}>
        <Stack direction="row" gap={2} alignItems="center">
          <StaticKioskChip
            kioskName={kioskName}
            currentWallName={wall.wall.name}
          />
          <FullScreenButton targetElement={wallRef.current} />
        </Stack>
      </KioskOverlayMenu>
    </Box>
  );
}
