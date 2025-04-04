import { useAuth0 } from "@auth0/auth0-react";
import { ArchiveDefaultView } from "components/archive/ArchiveDefaultView";
import { ArchiveCard, ViewArchiveDrawer } from "features/archive";
import { useIsAdmin } from "components/layout/RoleGuards";
import { useState } from "react";
import { Box, CircularProgress, Fade, Grow, Stack } from "@mui/material";
import { AbsolutelyCentered } from "components/AbsolutelyCentered";
import { SearchInput } from "components/devices/SearchInput";
import { MountIf } from "coram-common-utils";
import { NoResultFoundPlaceholder } from "components/common";
import { TransitionGroup } from "react-transition-group";
import Grid from "@mui/material/Unstable_Grid2";
import { useArchivesSorted } from "./hooks";

export function ArchivePage() {
  const { user } = useAuth0();
  const isAdmin = useIsAdmin();

  const {
    isFetched: archivesLoaded,
    data: archives,
    refetch: refetchArchives,
  } = useArchivesSorted();

  const [searchQuery, setSearchQuery] = useState("");
  const filteredArchives = archives.filter(
    (archive) =>
      searchQuery === "" ||
      archive.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      archive.owner_user_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [selectedArchiveId, setSelectedArchiveId] = useState<number | null>(
    null
  );
  const selectedArchive = archives?.find(
    (archive) => archive.id === selectedArchiveId
  );

  if (!archivesLoaded) {
    return (
      <AbsolutelyCentered>
        <CircularProgress color="secondary" />
      </AbsolutelyCentered>
    );
  }

  return (
    <Stack gap={2} pt={2}>
      <SearchInput
        placeHolder="Search"
        value={searchQuery}
        onChange={setSearchQuery}
        sx={{ height: "40px", width: "22rem", bgcolor: "white" }}
      />
      <MountIf condition={archives.length > 0}>
        <Grid container spacing={2}>
          <TransitionGroup component={null}>
            {filteredArchives.map((archive) => (
              <Grow key={archive.id} timeout={350} in={true}>
                <Grid xs={12} sm={6} md={4} lg={3}>
                  <ArchiveCard
                    archive={archive}
                    onClick={() => setSelectedArchiveId(archive.id)}
                    thumbnail={archive.preview_thumbnail}
                  />
                </Grid>
              </Grow>
            ))}
          </TransitionGroup>
        </Grid>
        <Fade in={filteredArchives.length === 0} timeout={500}>
          <Box>
            <AbsolutelyCentered>
              <NoResultFoundPlaceholder text="No Archives found" />
            </AbsolutelyCentered>
          </Box>
        </Fade>
      </MountIf>
      <MountIf condition={archives.length === 0}>
        <ArchiveDefaultView />
      </MountIf>
      <ViewArchiveDrawer
        archive={selectedArchive}
        allowEdit={user?.email === selectedArchive?.owner_user_email || isAdmin}
        onClose={async () => {
          setSelectedArchiveId(null);
          await refetchArchives();
        }}
        refetchArchives={refetchArchives}
      />
    </Stack>
  );
}
