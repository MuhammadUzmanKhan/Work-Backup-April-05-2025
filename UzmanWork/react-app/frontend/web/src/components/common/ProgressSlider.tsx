import { Slider, type SliderProps, Stack, Typography } from "@mui/material";

interface ProgressSliderProps extends SliderProps {
  name: string;
  onProgressChange: (value: number) => void;
}

export function ProgressSlider({
  name,
  onProgressChange,
  ...sliderProps
}: ProgressSliderProps) {
  return (
    <Stack flexDirection="row" alignItems="center" columnGap={2}>
      <Typography variant="body2" flexShrink={0}>
        {`${name} :`}
      </Typography>
      <Slider
        step={null}
        onChange={(event, value) => onProgressChange(value as number)}
        {...sliderProps}
      />
    </Stack>
  );
}
