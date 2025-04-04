import {
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { KioskList } from "components/kiosk/editor/KioskList";
import { useState, useContext, useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  DEFAULT_ROTATE_FREQUENCY_S,
  KioskDrawerMode,
  UpdateWallsForKioskParams,
} from "components/kiosk/editor/utils";
import { KioskDrawer } from "components/kiosk/editor/KioskDrawer";
import { KioskDefaultView } from "components/kiosk/editor/KioskDefaultView";
import { useUserWalls } from "hooks/personal_wall";
import { NotificationContext } from "contexts/notification_context";
import {
  KioskService,
  Wall,
  Kiosk,
  UpdateWallsForKioskRequest,
  UpdateKioskStatusRequest,
  RenameKioskRequest,
  ShareKioskRequest,
} from "coram-common-utils";
import { useKiosks } from "hooks/kiosk_editor";
import { TOOLBAR_HEIGHT_PX } from "components/navbar/navbar";
import { getFetchAndRefetchHandler } from "utils/error_handling";
import { SearchInput } from "components/devices/SearchInput";

interface KioskPageViewProps {
  userWalls: Wall[];
  kiosks: Kiosk[];
  refetch: () => Promise<unknown>;
}

function KioskPageView({ userWalls, kiosks, refetch }: KioskPageViewProps) {
  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const { setNotificationData } = useContext(NotificationContext);
  const [kioskSearchQuery, setKioskSearchQuery] = useState<string>("");
  const { user } = useAuth0();
  const initialKiosk = useMemo(() => {
    return {
      walls: [],
      rotateFrequencyS: DEFAULT_ROTATE_FREQUENCY_S,
    };
  }, []);

  const handleErrorAndRefetch = getFetchAndRefetchHandler(
    refetch,
    setNotificationData
  );

  // Callback functions
  async function onUpdateKioskWalls(request: UpdateWallsForKioskRequest) {
    await handleErrorAndRefetch(
      () => KioskService.updateWalls(request),
      "Failed to update kiosk walls"
    );
  }
  async function onCreateKiosk(params: UpdateWallsForKioskParams) {
    await handleErrorAndRefetch(async () => {
      // Iterate until we find a unique name for the kiosk.
      let kioskName = "";
      for (let i = 1; ; i++) {
        kioskName = `Kiosk ${i}`;
        const kiosk = kiosks.find((kiosk) => kiosk.name === kioskName);
        if (!kiosk) {
          break;
        }
      }
      await KioskService.create({
        name: kioskName,
        rotate_frequency_s: params.rotateFrequencyS,
        wall_ids: params.walls.map((wall) => wall.id),
      });
    }, "Failed to create kiosk");
  }
  async function onUpdateKioskStatus(request: UpdateKioskStatusRequest) {
    await handleErrorAndRefetch(
      async () => await KioskService.updateStatus(request),
      "Failed to update kiosk status"
    );
  }
  async function onRemoveKiosk(kiosk_id: number) {
    await handleErrorAndRefetch(
      async () => await KioskService.delete(kiosk_id),
      "Failed to remove kiosk"
    );
  }
  async function onRegenerateKioskHash(kiosk_id: number) {
    await handleErrorAndRefetch(
      async () => await KioskService.regenerate(kiosk_id),
      "Failed to regenerate kiosk hash"
    );
  }
  async function onRenameKiosk(request: RenameKioskRequest) {
    await handleErrorAndRefetch(
      async () => await KioskService.rename(request),
      "Failed to rename kiosk"
    );
  }
  async function onShareKiosk(request: ShareKioskRequest) {
    // Note that errors are handled in the ShareKioskDialog, so we don't have to
    // handle them here.
    await KioskService.share(request);
  }
  // Filter kiosks by name
  const filteredKiosks = kiosks.filter((kiosk) =>
    kiosk.name.toLowerCase().includes(kioskSearchQuery.toLowerCase())
  );

  return (
    <Card
      sx={{
        minHeight: `calc(100vh - ${TOOLBAR_HEIGHT_PX}px)`,
        display: "flex",
        flexDirection: "column",
        padding: 2,
        pb: 0,
      }}
    >
      {kiosks.length > 0 ? (
        <>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            p={2}
          >
            <Typography variant="h2">Active Kiosks</Typography>
            <Stack direction="row" gap={1}>
              <SearchInput
                placeHolder="Search"
                value={kioskSearchQuery}
                onChange={(value) => setKioskSearchQuery(value)}
              />
              <Button
                color="secondary"
                variant="contained"
                sx={{ borderRadius: "0.3rem" }}
                onClick={() => setOpenDrawer(true)}
              >
                <AddIcon fontSize="small" />
                <Typography variant="body2"> Create Kiosk Wall</Typography>
              </Button>
            </Stack>
          </Stack>
          <KioskList
            kiosks={filteredKiosks}
            userWalls={userWalls}
            currentUserEmail={user?.email ?? ""}
            onUpdateKioskWalls={onUpdateKioskWalls}
            onUpdateKioskStatus={onUpdateKioskStatus}
            onRemoveKiosk={onRemoveKiosk}
            onRegenerateKioskHash={onRegenerateKioskHash}
            onRenameKiosk={onRenameKiosk}
            onShareKiosk={onShareKiosk}
          />
        </>
      ) : (
        <KioskDefaultView setOpenDrawer={setOpenDrawer} />
      )}
      <KioskDrawer
        open={openDrawer}
        setOpen={setOpenDrawer}
        initialKiosk={initialKiosk}
        userWalls={userWalls}
        drawerMode={KioskDrawerMode.Create}
        onKioskSubmit={onCreateKiosk}
      />
    </Card>
  );
}

export function KioskPage() {
  const {
    data: userWalls,
    isFetchedAfterMount: isUserWallsFetched,
    refetch: refetchUserWalls,
  } = useUserWalls();
  const {
    data: kiosks,
    isFetchedAfterMount: isKiosksFetched,
    refetch: refetchKiosks,
  } = useKiosks();

  return (
    <>
      {!isUserWallsFetched || !isKiosksFetched || !kiosks ? (
        <Box pt={4} px={2} minHeight={`calc(100vh - ${TOOLBAR_HEIGHT_PX}px)`}>
          <CircularProgress size={45} color="secondary" />
        </Box>
      ) : (
        <KioskPageView
          // Pick out only the walls, because that's all the information we need
          // to create kiosks.
          userWalls={userWalls.walls.map((wallResponse) => wallResponse.wall)}
          kiosks={kiosks.kiosks.map((kioskResponse) => kioskResponse.kiosk)}
          refetch={async () => {
            await refetchUserWalls();
            await refetchKiosks();
          }}
        />
      )}
    </>
  );
}
