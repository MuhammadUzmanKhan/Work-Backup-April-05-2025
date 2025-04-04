import { Skeleton } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { useIsMobile } from "components/layout/MobileOnly";

const NO_OF_SKELETONS = 9;

export function WallSkeleton() {
  const isMobile = useIsMobile();
  return (
    <Grid container>
      {Array(NO_OF_SKELETONS)
        .fill("")
        .map((_, index) => (
          <Grid xs={isMobile ? 12 : 4} key={index} p={1}>
            <Skeleton
              animation="wave"
              variant="rectangular"
              width="100%"
              height={200}
              sx={{ borderRadius: "0.2rem" }}
            />
          </Grid>
        ))}
    </Grid>
  );
}
