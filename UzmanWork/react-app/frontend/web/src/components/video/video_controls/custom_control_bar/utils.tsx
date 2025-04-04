export enum VideoState {
  Paused = "paused",
  Playing = "playing",
  Ended = "ended",
  Unavailable = "unavailable",
}

export function formatTime(time: number) {
  if (time === Infinity) {
    return "--:--";
  }

  const minutes = (Math.floor(time / 60) || 0).toString().padStart(2, "0");
  const seconds = (Math.floor(time % 60) || 0).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function canRewind(video: HTMLVideoElement | undefined) {
  if (!video) return false;
  return Math.ceil(video.currentTime) > 0;
}

export function canForward(video: HTMLVideoElement | undefined) {
  if (!video) return false;
  return Math.ceil(video.currentTime) < Math.ceil(video.duration);
}

export function getVideoState(video: HTMLVideoElement | undefined) {
  if (video) {
    if (Math.ceil(video.currentTime) === Math.ceil(video.duration)) {
      return VideoState.Ended;
    } else if (video.paused) {
      return VideoState.Paused;
    } else {
      return VideoState.Playing;
    }
  }
  return VideoState.Unavailable;
}

export function bufferProgressPerc(videoElement: HTMLMediaElement) {
  if (videoElement.buffered.length > 0) {
    const bufferedEnd = videoElement.buffered.end(
      videoElement.buffered.length - 1
    );
    return (bufferedEnd / videoElement.duration) * 100;
  }
  return 0;
}

export function onVideoSeek(
  event: MouseEvent | TouchEvent,
  progressBarElement: HTMLElement,
  videoElement: HTMLMediaElement,
  setProgressPercentage: (perc: number) => void
) {
  const rect = progressBarElement.getBoundingClientRect();
  let x;

  if (event.type === "touchmove" || event.type === "touchstart") {
    // For touch events, use the first touch point
    x = (event as TouchEvent).touches[0].clientX;
  } else {
    x = (event as MouseEvent).clientX;
  }
  const xPerc = Math.max(0, Math.min((x - rect.left) / rect.width, 1));
  const scrubTime = xPerc * videoElement.duration;
  videoElement.currentTime = scrubTime;
  setProgressPercentage(xPerc);
}

export function rewindVideo(videoElement: HTMLVideoElement) {
  const newTime = Math.max(videoElement.currentTime - 10, 0); // Limit the rewinding to a minimum of 0 seconds
  videoElement.currentTime = newTime;
}

export function forwardVideo(videoElement: HTMLVideoElement) {
  const newTime = Math.min(
    videoElement.currentTime + 10,
    videoElement.duration
  ); // Limit the forwarding to the maximum of video duration
  videoElement.currentTime = newTime;
}

export function togglePlayPauseVideo(videoElement: HTMLVideoElement) {
  const videoState = getVideoState(videoElement);
  if (videoState === VideoState.Paused || videoState === VideoState.Ended) {
    videoElement.play();
  } else if (videoState === VideoState.Playing) {
    videoElement.pause();
  }
}
