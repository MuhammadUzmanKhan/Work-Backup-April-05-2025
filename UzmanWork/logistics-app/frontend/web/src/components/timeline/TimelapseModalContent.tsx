import { Fragment, useEffect, useState } from "react";
import { OpenAPI } from "coram-common-utils";
import { CircularProgress, Stack } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { TimelapseParams } from "components/timeline/panels/TimelapsePanel";

export interface TimelapseModalContentProps {
  timelapseUrl: string;
  timelapseParams: TimelapseParams;
}

export function TimelapseModalContent({
  timelapseUrl,
  timelapseParams,
}: TimelapseModalContentProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (timelapseUrl != "") {
      setLoading(false);
    }
  }, [timelapseUrl, setLoading]);

  const startTime = timelapseParams.start_time.toISO();
  const endTime = timelapseParams.end_time.toISO();
  const fileName = `timelapse-${startTime}-${endTime}.mp4`;

  return (
    <Fragment>
      {loading ? (
        <CircularProgress size={80} sx={{ color: "neutral.1000" }} />
      ) : (
        <Stack>
          <Grid>
            <video controls autoPlay playsInline muted>
              <source src={`${OpenAPI.BASE}${timelapseUrl}`} type="video/mp4" />
            </video>
          </Grid>

          <Grid
            container
            alignItems="center"
            style={{
              backgroundColor: "white",
            }}
          >
            <Grid>{fileName}</Grid>
          </Grid>
        </Stack>
      )}
    </Fragment>
  );
}
