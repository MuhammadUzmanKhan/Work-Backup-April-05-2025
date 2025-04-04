import Grid from "@mui/material/Unstable_Grid2";
import { Stack } from "@mui/material";
import { TextBox } from "./TextBox";
import {
  WbSunnyOutlined as WbSunnyOutlinedIcon,
  GppMaybeOutlined as GppMaybeOutlinedIcon,
  TipsAndUpdatesOutlined as TipsAndUpdatesOutlinedIcon,
} from "@mui/icons-material";

export function AssistantInfo() {
  return (
    <Grid
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "16px",
        textAlign: "left",
        fontSize: "14px",
        maxHeight: "10%",
        fontStyle: "normal",
        fontWeight: "bold",
      }}
    >
      <Stack alignItems="center" spacing={2}>
        <Grid>
          <WbSunnyOutlinedIcon
            style={{
              backgroundColor: "inherit",
              fontSize: "48px",
            }}
          />
        </Grid>
        <Grid> Examples </Grid>
        <TextBox text="What time did the first person come in today?" />
        <TextBox text="Which cameras had a person activity between 1 am and 2 am yesterday?" />
        <TextBox text="What was the maximum number of people seen at the same time in the camera X or Y?" />
      </Stack>

      <Stack alignItems="center" spacing={2}>
        <Grid>
          <TipsAndUpdatesOutlinedIcon
            style={{
              backgroundColor: "inherit",
              fontSize: "48px",
            }}
          />
        </Grid>
        <Grid textAlign="center"> Tips </Grid>
        <TextBox text="reword the search if you don't like the results" />
        <TextBox text="be specific about time, cameras and what you are interested in" />
      </Stack>

      <Stack alignItems="center" spacing={2}>
        <Grid>
          <GppMaybeOutlinedIcon
            style={{
              backgroundColor: "inherit",
              fontSize: "48px",
            }}
          />
        </Grid>
        <Grid> Limitations </Grid>
        <TextBox text="may occasionally generate incorrect information" />
        <TextBox text="knows only about events in the past week" />
      </Stack>
    </Grid>
  );
}
