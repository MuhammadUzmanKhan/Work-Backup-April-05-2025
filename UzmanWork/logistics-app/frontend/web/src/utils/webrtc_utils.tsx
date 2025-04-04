import { DateTime } from "luxon";
import { isDefined } from "./types";
// NOTE(@lberg): firefox does not implement requestVideoFrameCallback, polyfill it
import "rvfc-polyfill";

// NOTE(@lberg): this is how many seconds we assume the stream is behind
// This is an assumption, we are NOT using the NTP protocol to sync the clocks
const WEBRTC_TIME_OFFSET_S = 2;
// NOTE(@lberg): this is the clock rate of the RTP timestamps
// This is an assumption, we are not computing this from the peer connection (we could)
// This value should be fine because it's set in
// https://github.com/awslabs/amazon-kinesis-video-streams-webrtc-sdk-c/blob/master/src/source/PeerConnection/SessionDescription.h#L72
const WEBRTC_CLOCK_HZ = 90000;

// Utility class to keep track of the current time based on the RTP timestamps
export class WebRtcTimeKeeper {
  time: DateTime;
  lastRtpTime: number;
  constructor() {
    this.time = DateTime.invalid("not initialized");
    this.lastRtpTime = 0;
  }

  updateCurrentTime(rtpTime: number) {
    if (!this.time.isValid) {
      this.time = DateTime.now().minus({ seconds: WEBRTC_TIME_OFFSET_S });
      this.lastRtpTime = rtpTime;
      return;
    }
    if (rtpTime < this.lastRtpTime) {
      // rtpTime has wrapped around
      this.time = this.time.plus({
        seconds: (rtpTime + 2 ** 32 - this.lastRtpTime) / WEBRTC_CLOCK_HZ,
      });
    } else {
      this.time = this.time.plus({
        seconds: (rtpTime - this.lastRtpTime) / WEBRTC_CLOCK_HZ,
      });
    }

    this.lastRtpTime = rtpTime;
  }

  getCurrentTime() {
    return this.time;
  }

  registerVideoFrameCallback(video: HTMLVideoElement) {
    video.requestVideoFrameCallback((now, media) => {
      const onVideoFrameCallback = (
        _now: number,
        media: VideoFrameCallbackMetadata
      ) => {
        if (isDefined(media.rtpTimestamp)) {
          this.updateCurrentTime(media.rtpTimestamp);
        } else {
          // in this case there is nothing we can do to estimate the time
          // just assume we are live because we are playing
          this.time = DateTime.now().minus({ seconds: WEBRTC_TIME_OFFSET_S });
        }
        // We have to call this again to get the next frame
        video.requestVideoFrameCallback(onVideoFrameCallback);
      };
      onVideoFrameCallback(now, media);
    });
  }
}
