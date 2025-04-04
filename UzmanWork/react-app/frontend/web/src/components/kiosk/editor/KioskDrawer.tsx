import { Divider, Link, Stack, Typography } from "@mui/material";
import {
  UpdateWallsForKioskParams,
  KioskType,
  KioskDrawerMode,
  getKioskType,
  MIN_ROTATE_FREQUENCY_ALLOWED_S,
} from "./utils";
import { Wall } from "coram-common-utils";
import { useEffect, useState } from "react";
import { KioskDrawerFooter } from "./KioskDrawerFooter";
import { KioskDrawerHeader } from "./KioskDrawerHeader";
import { KioskWallCheckbox } from "./KioskWallCheckbox";
import { StyledDrawer } from "components/styled_components/StyledDrawer";

interface KioskDrawerProps {
  initialKiosk: UpdateWallsForKioskParams;
  userWalls: Wall[];
  open: boolean;
  drawerMode: KioskDrawerMode;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onKioskSubmit: (params: UpdateWallsForKioskParams) => Promise<void>;
}

export function KioskDrawer({
  open,
  setOpen,
  initialKiosk,
  userWalls,
  onKioskSubmit,
  drawerMode,
}: KioskDrawerProps) {
  // State for the kiosk drawer that will be modified as we interact with the
  // drawer.
  const [kioskDrawerState, setKioskDrawerState] =
    useState<UpdateWallsForKioskParams>(initialKiosk);
  const sortedWalls = userWalls.sort((a, b) => a.name.localeCompare(b.name));
  const kioskType = getKioskType(kioskDrawerState.walls.length);
  const isSubmitDisabled =
    // At least one wall has to be chosen
    kioskDrawerState.walls.length === 0 ||
    (kioskType === KioskType.ROTATING_WALL &&
      kioskDrawerState.rotateFrequencyS < MIN_ROTATE_FREQUENCY_ALLOWED_S);

  // Make sure to keep up to date the kiosk drawer state.
  useEffect(() => {
    setKioskDrawerState(initialKiosk);
  }, [initialKiosk]);

  return (
    <StyledDrawer open={open} onClose={() => setOpen(false)}>
      <KioskDrawerHeader
        drawerMode={drawerMode}
        onCloseClick={() => setOpen(false)}
      />
      <Stack height="100%" justifyContent="space-between">
        <Stack p={2} gap={3}>
          <Stack>
            {sortedWalls.length > 0 ? (
              sortedWalls.map((wall) => (
                <KioskWallCheckbox
                  key={wall.id}
                  labelName={wall.name}
                  isChecked={
                    kioskDrawerState.walls.find(
                      (kioskWall) => kioskWall.id === wall.id
                    ) !== undefined
                  }
                  onChange={(isChecked: boolean) => {
                    if (isChecked) {
                      setKioskDrawerState((prevState) => ({
                        ...prevState,
                        walls: [...prevState.walls, wall],
                      }));
                    } else {
                      setKioskDrawerState((prevState) => ({
                        ...prevState,
                        walls: prevState.walls.filter(
                          (kioskWall) => kioskWall.id !== wall.id
                        ),
                      }));
                    }
                  }}
                />
              ))
            ) : (
              <Typography fontWeight={600}>
                Please
                <Link href="/wall"> create a personal wall </Link>
                that you can use in the kiosk!
              </Typography>
            )}
          </Stack>
        </Stack>
        <Stack>
          <Divider />
          <KioskDrawerFooter
            submitButtonText={
              drawerMode === KioskDrawerMode.Create ? "Create" : "Save"
            }
            rotationFreqFieldHidden={kioskType === KioskType.STATIC_WALL}
            rotationFreqS={kioskDrawerState.rotateFrequencyS}
            setRotationFreqS={(rotationFreqS: number) => {
              setKioskDrawerState((prevState) => ({
                ...prevState,
                rotateFrequencyS: rotationFreqS,
              }));
            }}
            minRotationFreqAllowedS={MIN_ROTATE_FREQUENCY_ALLOWED_S}
            onClick={async () => {
              // Sort walls by name before submitting.
              const requestToSubmit = kioskDrawerState;
              requestToSubmit.walls = requestToSubmit.walls.sort((a, b) =>
                a.name.localeCompare(b.name)
              );

              await onKioskSubmit(requestToSubmit);
              setOpen(false);
            }}
            isSubmitDisabled={isSubmitDisabled}
          />
        </Stack>
      </Stack>
    </StyledDrawer>
  );
}
