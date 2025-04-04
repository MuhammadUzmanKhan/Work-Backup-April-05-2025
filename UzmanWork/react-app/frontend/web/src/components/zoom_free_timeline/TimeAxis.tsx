import { computeRatio, ScaleDetailLevel, VisiblePortion } from "./utils";
import { TimeInterval } from "utils/time";
import { useMemo } from "react";
import { Stage, Layer, Text, Rect, Group } from "react-konva";
import { KonvaContainer } from "./KonvaContainer";
import { DateTime, Interval } from "luxon";

// The width of the text box, used only to center the text
const TEXT_BOX_WIDTH = 200;
//  Font size at the current scale of zoom
const FONT_AT_SCALE_SIZE = 14;

interface Mark {
  time: DateTime;
  ratio: number;
}

// Return a list of times to be displayed on the axis based on the scale
function getDayMarks(
  timeInterval: TimeInterval,
  scaleDetail: ScaleDetailLevel
) {
  const marks: Mark[] = [];
  const totalMinutes = timeInterval.timeEnd
    .diff(timeInterval.timeStart)
    .as("minutes");
  let incrementMinutes = null;
  switch (scaleDetail) {
    case ScaleDetailLevel.OneWeek:
      incrementMinutes = 1440;
      break;
    case ScaleDetailLevel.OneDay:
      incrementMinutes = 120;
      break;
    case ScaleDetailLevel.TwelveHours:
      incrementMinutes = 60;
      break;
    case ScaleDetailLevel.SixHours:
      incrementMinutes = 30;
      break;
    case ScaleDetailLevel.ThreeHours:
      incrementMinutes = 15;
      break;
    case ScaleDetailLevel.OneHour:
      incrementMinutes = 5;
      break;
    case ScaleDetailLevel.ThirtyMinutes:
      incrementMinutes = 2;
      break;
    default: {
      const _exhaustiveCheck: never = scaleDetail;
      throw new Error(`Unhandled scale detail: ${_exhaustiveCheck}`);
    }
  }

  const intervals = Interval.fromDateTimes(
    timeInterval.timeStart.plus({ minutes: incrementMinutes }),
    timeInterval.timeEnd
  ).splitBy({ minutes: incrementMinutes });

  for (const interval of intervals) {
    if (!interval.start) {
      continue;
    }
    marks.push({
      time: interval.start,
      ratio:
        interval.start.diff(timeInterval.timeStart).as("minutes") /
        totalMinutes,
    });
  }

  return marks;
}

interface TimeMarkProps {
  time: DateTime;
  x: number;
  height: number;
  fontSize: number;
  textColor: string;
  format?: Intl.DateTimeFormatOptions;
}

function TimeMark({
  time,
  x,
  height,
  fontSize,
  textColor,
  format = DateTime.TIME_24_SIMPLE,
}: TimeMarkProps) {
  return (
    <Group>
      <Rect x={x} y={0} width={1} height={height / 4} fill="lightgray" />
      <Text
        x={x - TEXT_BOX_WIDTH / 2}
        y={height / 2}
        width={TEXT_BOX_WIDTH}
        fontSize={fontSize}
        fontFamily="sans-serif"
        fill={textColor}
        align="center"
        text={time.toLocaleString(format)}
      />
    </Group>
  );
}

interface TimeAxisProps {
  visiblePortion: VisiblePortion;
  scaleDetailLevel: ScaleDetailLevel;
  timeInterval: TimeInterval;
  heightPx: number;
  widthPx: number;
}

export function TimeAxis({
  visiblePortion,
  scaleDetailLevel,
  timeInterval,
  heightPx,
  widthPx,
}: TimeAxisProps) {
  // Set all the marks at all the scales.
  const levelMarks = useMemo(
    () =>
      new Map(
        Object.values(ScaleDetailLevel).map((scaleDetail) => [
          scaleDetail,
          getDayMarks(timeInterval, scaleDetail),
        ])
      ),
    [timeInterval]
  );
  const marksAtScale = levelMarks.get(scaleDetailLevel) || [];
  return (
    <KonvaContainer sx={{ height: heightPx }}>
      <Stage width={widthPx} height={heightPx}>
        <Layer>
          {marksAtScale.map((mark, idx) => {
            const position = computeRatio(mark.ratio, visiblePortion);
            if (position < 0 || position > 1) {
              return null;
            }
            const format =
              scaleDetailLevel === ScaleDetailLevel.OneWeek
                ? { ...DateTime.DATE_MED_WITH_WEEKDAY, year: undefined }
                : DateTime.TIME_24_SIMPLE;
            return (
              <TimeMark
                key={idx}
                time={mark.time}
                x={position * widthPx}
                height={heightPx}
                fontSize={FONT_AT_SCALE_SIZE}
                textColor="gray"
                format={format}
              />
            );
          })}
        </Layer>
      </Stage>
    </KonvaContainer>
  );
}
