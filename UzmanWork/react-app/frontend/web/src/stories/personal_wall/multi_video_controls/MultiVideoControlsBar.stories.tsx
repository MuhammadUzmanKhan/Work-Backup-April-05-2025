import type { Meta, StoryObj } from "@storybook/react";
import { MultiVideoControlsBar } from "components/personal_wall/multi_video_controls/MultiVideoControlsBar";
import { DateTime, Duration } from "luxon";
import { useState } from "react";

const meta: Meta<typeof MultiVideoControlsBar> = {
  title: "PersonalWall/MultiVideoControls/MultiVideoControlsBar",
  component: MultiVideoControlsBar,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MultiVideoControlsBar>;

function MultiVideoControlsBarWrapped(
  props: Parameters<typeof MultiVideoControlsBar>[0]
) {
  const [videoSpeed, setVideoSpeed] = useState<number>(props.playbackRate);
  const [isPlaying, setIsPlaying] = useState<boolean>(props.isPlaying);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<DateTime>(
    DateTime.now().setZone(props.timezone)
  );

  return (
    <MultiVideoControlsBar
      {...props}
      playbackRate={videoSpeed}
      isPlaying={isPlaying}
      onPlaybackRateControlClick={setVideoSpeed}
      onPauseClick={() => setIsPlaying(false)}
      onPlayClick={() => setIsPlaying(true)}
      onTimeBarClick={(time) => {
        setCurrentTime(time);
        setIsLive(false);
      }}
      onLiveClick={() => {
        setCurrentTime(DateTime.now().setZone(props.timezone));
        setIsLive(true);
      }}
      syncTime={currentTime}
      isLive={isLive}
      clipTimeInterval={{
        timeStart: DateTime.now(),
        timeEnd: DateTime.now().plus(Duration.fromObject({ minutes: 5 })),
      }}
    />
  );
}

export const Interactions: Story = {
  args: {
    playbackRate: 1,
    isPlaying: true,
    timezone: "America/New_York",
  },
  render: (args) => <MultiVideoControlsBarWrapped {...args} />,
};
