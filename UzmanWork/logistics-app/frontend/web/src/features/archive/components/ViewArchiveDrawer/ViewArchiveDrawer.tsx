import { Divider, Drawer } from "@mui/material";
import { ArchiveResponse } from "utils/archives_types";
import {
  ViewArchiveDrawerHeader,
  ViewArchiveDrawerLeftPanel,
  ViewArchiveDrawerRightPanel,
} from "./components";
import { useState } from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { isDefined } from "coram-common-utils";

export interface ArchiveDrawerProps {
  archive: ArchiveResponse | undefined;
  allowEdit: boolean;
  onClose: VoidFunction;
  refetchArchives: () => Promise<unknown>;
}

export function ViewArchiveDrawer({
  archive,
  allowEdit,
  onClose,
  refetchArchives,
}: ArchiveDrawerProps) {
  const archiveSelected = isDefined(archive);

  return (
    <Drawer
      anchor="right"
      open={archiveSelected}
      onClose={onClose}
      PaperProps={{ sx: { width: "89vw", height: "100vh" } }}
    >
      <ViewArchiveDrawerHeader onCloseClick={onClose} />
      <Divider />
      {archiveSelected && (
        <ViewArchiveDrawerContent
          key={archive.id}
          archive={archive}
          allowEdit={allowEdit}
          onClose={onClose}
          refetchArchives={refetchArchives}
        />
      )}
    </Drawer>
  );
}

interface ViewArchiveDrawerContentProps {
  archive: ArchiveResponse;
  allowEdit: boolean;
  onClose: VoidFunction;
  refetchArchives: () => Promise<unknown>;
}

function ViewArchiveDrawerContent({
  archive,
  allowEdit,
  onClose,
  refetchArchives,
}: ViewArchiveDrawerContentProps) {
  const [selectedClip, setSelectedClip] = useState(archive.clips[0]);

  return (
    <Grid container height="100%" sx={{ overflowY: "hidden" }}>
      <Grid
        xs={8}
        pt={1}
        pb={4}
        px={2}
        display="flex"
        flexDirection="column"
        gap={1}
        height="100%"
        sx={{ overflowY: "auto" }}
      >
        <ViewArchiveDrawerLeftPanel
          archive={archive}
          selectedClip={selectedClip}
          onSelectClip={setSelectedClip}
          allowEdit={allowEdit}
          refetchArchives={refetchArchives}
          onClose={onClose}
        />
      </Grid>
      <Grid xs={4} pt={1.4} pr={2} height="100%" sx={{ overflowY: "auto" }}>
        <ViewArchiveDrawerRightPanel
          archive={archive}
          selectedClip={selectedClip}
          onSelectClip={setSelectedClip}
          refetchArchives={refetchArchives}
        />
      </Grid>
    </Grid>
  );
}
