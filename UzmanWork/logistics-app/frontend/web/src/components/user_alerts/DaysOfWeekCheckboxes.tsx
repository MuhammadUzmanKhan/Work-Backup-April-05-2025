import type { SxProps } from "@mui/material";
import { Avatar } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { DayOfWeek } from "coram-common-utils";

// TODO(@lberg): move to common
interface DaysOfWeekCheckboxesProps {
  readonly?: boolean;
  days: Array<DayOfWeek>;
  setDays?: (days: Array<DayOfWeek>) => void;
  iconColors: (selected: boolean) => SxProps;
}

export function DaysOfWeekCheckboxes({
  readonly,
  days,
  setDays,
  iconColors,
}: DaysOfWeekCheckboxesProps) {
  const items = (Object.values(DayOfWeek) as Array<DayOfWeek>).map((day) => (
    <Grid key={day}>
      <Avatar
        variant="square"
        sx={{
          width: { xs: 15, xl: 25 },
          height: { xs: 15, xl: 25 },
          fontSize: { xs: "0.75rem", xl: "0.85rem" },
          padding: "10px",
          borderRadius: "3px",
          marginBottom: "5px",
          cursor: readonly ? "not-allowed" : "pointer",
          ...iconColors(days.includes(day as DayOfWeek)),
        }}
        onClick={() => {
          if (readonly || setDays == undefined) return;
          if (days.includes(day as DayOfWeek)) {
            setDays(days.filter((d) => d !== (day as DayOfWeek)));
          } else {
            setDays([...days, day as DayOfWeek]);
          }
        }}
      >
        {day.toUpperCase()[0]}
      </Avatar>
    </Grid>
  ));
  return (
    <Grid
      container
      direction="row"
      alignItems="center"
      spacing={0.5}
      flexWrap="wrap"
      justifyContent="flex-start"
      p={0}
    >
      {items}
    </Grid>
  );
}
