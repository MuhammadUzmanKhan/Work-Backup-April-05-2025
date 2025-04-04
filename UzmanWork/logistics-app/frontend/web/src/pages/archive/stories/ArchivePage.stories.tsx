import { Grid } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { ViewArchiveDrawer } from "features/archive";

import { ArchiveCard } from "features/archive/components";
import { DateTime } from "luxon";
import archive_handlers from "mocks/archive_handlers";
import thumbnail_query_handler from "mocks/thumbnail_query_handler";
import { useState } from "react";
import { ArchiveResponse } from "utils/archives_types";
import { ARCHIVES } from "./consts";

const meta: Meta<typeof ViewArchiveDrawer> = {
  title: "Archive/ArchivePage",
  component: ViewArchiveDrawer,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: { ...archive_handlers, ...thumbnail_query_handler },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ViewArchiveDrawer>;

function Page() {
  const [archive, setArchive] = useState<ArchiveResponse | null>(null);
  const userEmail = "firstUser@gmail.com";

  return (
    <Grid container columnGap={3}>
      {ARCHIVES.map((archive) => (
        <Grid key={archive.id} xs={3}>
          <ArchiveCard
            archive={archive}
            thumbnail={{
              s3_signed_url: "https://via.placeholder.com/200x150",
              timestamp: DateTime.now(),
              s3_path: "",
            }}
            onClick={() => {
              setArchive(ARCHIVES[0]);
            }}
          />
        </Grid>
      ))}
      <ViewArchiveDrawer
        archive={archive ?? undefined}
        allowEdit={archive?.owner_user_email === userEmail}
        onClose={() => setArchive(null)}
        refetchArchives={async () => null}
      />
    </Grid>
  );
}

export const Default: Story = {
  render: () => <Page />,
};
