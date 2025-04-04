import {
  VideoAlertLive,
  VideoAlertClip,
  MonitorService,
  ApiError,
  WebRtcData,
  KinesisApiPublicService,
  KinesisUrlSource,
  isKinesisLiveRequest,
  isKinesisUrlFromStream,
  isKinesisVideoClipRequest,
} from "coram-common-utils";
import { DateTime } from "luxon";
import {
  RequestSigner,
  QueryParams,
  SignalingClient,
  Role,
} from "amazon-kinesis-video-streams-webrtc";
import Hls, { HlsConfig } from "hls.js";
import { HTMLMediaElementIOS } from "hooks/video_player";
import { getHlsConfigInStorage } from "./session_storage";
import { isDefined } from "./types";
import { WebRtcTimeKeeper } from "./webrtc_utils";
import { useEffect } from "react";

// When we seek, keep this buffer from the seek value to avoid hitting the edge
const SEEK_END_BUFFER_S = 0.25;
// How much to wait to restart the video on error
const RELOAD_TIMEOUT_MS = 500;
// How much to wait to completely refetch the video data
const REFETCH_TIMEOUT_MS = 1000;
// How much time to wait for peer's signaling remote message.
const WAIT_PEER_SIGNALING_TIMEOUT_S = 10;

// Emit a stream alert to the backend.
export function emitStreamAlert(kinesisUrlSource: KinesisUrlSource) {
  // If we are using a shared video, we don't need to alert the backend since
  // it is a public resource, and the alert endpoint requires user
  // authentication to avoid spam alerts from a potential attacker.
  if (!isKinesisUrlFromStream(kinesisUrlSource)) {
    return;
  }

  let video_stream_alert_args: VideoAlertLive | VideoAlertClip | undefined =
    undefined;

  if (isKinesisLiveRequest(kinesisUrlSource.kinesisOptions)) {
    video_stream_alert_args = {
      video_type: VideoAlertLive.video_type.LIVE,
      live_request: kinesisUrlSource.kinesisOptions,
      mac_address: kinesisUrlSource.camera.mac_address,
    };
  } else if (isKinesisVideoClipRequest(kinesisUrlSource.kinesisOptions)) {
    video_stream_alert_args = {
      video_type: VideoAlertClip.video_type.CLIP,
      clip_request: kinesisUrlSource.kinesisOptions,
      mac_address: kinesisUrlSource.camera.mac_address,
    };
  } else {
    console.error("Unknown kinesis request type");
    return;
  }

  MonitorService.videoStreamAlert(video_stream_alert_args).catch((error) => {
    // check if the error is an ApiError
    if (!(error instanceof ApiError)) {
      console.error(`Error when connecting to backend: ${error}`);
      return;
    }
    console.error(`Error when connecting to backend: ${error.body.detail}`);
  });
}

// Generic interface for a video player across os/browser
// This is used to abstract the player implementation.
export interface PlayerInterface {
  videoName?: string;
  playingDate: () => DateTime;
  syncLive: () => void;
  videoElement: HTMLVideoElement;
  videoPlayerContainerRef?: HTMLDivElement | null;
  cleanup: () => void;
  reloadVideo: () => void;
}

export interface PlayerCallbacks {
  onSourceLoaded: () => void;
  onVideoStartedPlay: () => void;
  onVideoPaused: () => void;
  onVideoReload: () => void;
}

function syncLiveNativeVideo(video: HTMLVideoElement) {
  // Get the most recent seekable range and go to the end of it
  let seekEndTime = 0;
  for (let i = 0; i < video.seekable.length; i++) {
    seekEndTime = Math.max(seekEndTime, video.seekable.end(i));
  }
  if (seekEndTime === 0) {
    console.warn("No seekable range found");
    return;
  }
  seekEndTime = seekEndTime - SEEK_END_BUFFER_S;
  if (video.currentTime < seekEndTime) {
    video.currentTime = seekEndTime;
  }
  video.play();
}

export function initializeHlsPlayer(
  video: HTMLVideoElement,
  hasNativeHls: boolean,
  isLiveStream: boolean,
  src: string,
  videoName: string | undefined,
  playerCallbacks: PlayerCallbacks,
  initialSeekTime?: number
): PlayerInterface {
  if (!hasNativeHls) {
    let config: Partial<HlsConfig> = {
      debug: false,
      // NOTE(@lberg): Because this is a partial all fields are shown as optional
      // but undefined is NOT a valid value!
      // How many seconds of buffer we allow to skip
      maxBufferHole: 5,
      // By how much we nudge the video when it stalls
      // TODO(@lberg): there is a nudgeMaxRetry option, but it doesn't seem to work
      // I always only get one nudge
      nudgeOffset: isLiveStream ? 0.1 : 1.0,
      // After how much time we detect a stall
      highBufferWatchdogPeriod: 0.5,
      // NOTE(@lberg): This is how many seconds behind live we start from
      // It's tempting to set it to 0, but the video will stall more
      liveSyncDuration: 2,
      lowLatencyMode: true,
      // Keep up to these seconds of video in the back buffer
      // For clips, we keep everything. This is because of a bug in hls.js
      // where it stalls after going back in time
      backBufferLength: isLiveStream ? 30 : undefined,
      // NOTE(@lberg): For live we set this to the default value
      // Otherwise we start in the past due to caching
      startPosition: isLiveStream ? -1 : 0,
    };
    const debug_config = getHlsConfigInStorage();
    if (debug_config) {
      config = { ...config, ...debug_config };
      console.info("Integrating hls.js config from session", debug_config);
    }
    const player = new Hls(config);
    player.attachMedia(video);
    player.loadSource(src);
    playerCallbacks.onSourceLoaded();

    const reloadVideoFn = () => {
      playerCallbacks.onVideoReload();
      player.recoverMediaError();
      player.loadSource(src);
    };

    player.once(Hls.Events.FRAG_LOADED, () => {
      if (!isLiveStream && isDefined(initialSeekTime)) {
        video.currentTime = initialSeekTime;
      }
    });
    video.onpause = () => playerCallbacks.onVideoPaused();
    video.onplaying = () => playerCallbacks.onVideoStartedPlay();
    player.on(Hls.Events.ERROR, function (_, data) {
      if (data.fatal) {
        // onPlayerErrorRef.current?.(data);
        console.error(`fatal error encountered ${JSON.stringify(data)}`);
        if (!isLiveStream) {
          console.warn("not recovering as this is not a live stream.");
          return;
        }
        // NOTE(@lberg): we don't immediately reload the stream
        // because this might be due to no internet connection too
        // and we don't want to spam the user with reloads.
        setTimeout(() => {
          console.warn("Trying to recover by reloading the media.");
          reloadVideoFn();
        }, RELOAD_TIMEOUT_MS);
      }
    });

    return {
      videoName,
      playingDate: () => {
        const time = player.playingDate;
        if (!time) {
          return DateTime.invalid("No playing date");
        }
        return DateTime.fromJSDate(time);
      },
      syncLive: () => {
        if (!player.media || !player.liveSyncPosition) {
          return;
        }
        // Update the current time only if the live sync is ahead
        // From https://github.com/video-dev/hls.js/pull/636
        if (player.media.currentTime < player.liveSyncPosition) {
          console.debug(`Request to sync to live for ${videoName}`);
          player.media.currentTime = player.liveSyncPosition;
          player.media.play();
        }
      },
      videoElement: video,
      cleanup: () => {
        video.onpause = () => ({});
        player.detachMedia();
        player.destroy();
      },
      reloadVideo: reloadVideoFn,
    };
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    // NOTE(@lberg): this is true for safari on iOS and macbook,
    // but also for chrome on android we perform this check after the hls check
    // so that only safari on iOS will use this.
    video.src = src;
    playerCallbacks.onSourceLoaded();

    const reloadVideoFn = () => {
      playerCallbacks.onVideoReload();
      video.src = "";
      video.src = src;
      video.load();
    };

    // NOTE(@lberg): this is probably wrong but we are not using it
    // for ios yet. This event is not called just once
    video.onplay = () => {
      if (!isLiveStream && isDefined(initialSeekTime)) {
        video.currentTime = initialSeekTime;
      }
    };
    video.onplaying = () => playerCallbacks.onVideoStartedPlay();
    video.onpause = () => playerCallbacks.onVideoPaused();

    video.onerror = () => {
      const errorCode = video.error?.code;
      const errorMsg = video.error?.message;
      console.error(
        `Error loading ${videoName} code=(${errorCode}) msg=${errorMsg}.`
      );
      if (!isLiveStream) {
        console.warn("not recovering as this is not a live stream.");
        return;
      }
      // NOTE(@lberg): we don't immediately reload the stream
      // because this might be due to no internet connection too
      // and we don't want to spam the user with reloads.
      setTimeout(() => {
        console.warn("Trying to recover by reloading the media.");
        reloadVideoFn();
      }, RELOAD_TIMEOUT_MS);
    };

    return {
      videoName,
      playingDate: () => {
        return DateTime.fromJSDate(
          (video as unknown as HTMLMediaElementIOS).getStartDate()
        ).plus({ seconds: video.currentTime });
      },
      syncLive: () => syncLiveNativeVideo(video),
      videoElement: video,
      cleanup: () => {
        video.onplay = () => ({});
        video.onplaying = () => ({});
        video.onpause = () => ({});
        video.onerror = () => ({});
        video.pause();
        video.src = "";
      },
      reloadVideo: reloadVideoFn,
    };
  } else {
    console.error("Unsupported player");
    return {
      videoName,
      playingDate: () => DateTime.invalid("Unsupported player"),
      syncLive: () => console.error("Unsupported player"),
      videoElement: video,
      cleanup: () => console.error("Unsupported player"),
      reloadVideo: () => console.error("Unsupported player"),
    };
  }
}

export function initializeWebRtcPlayer(
  video: HTMLVideoElement,
  data: WebRtcData,
  sign_token: string,
  videoName: string | undefined,
  refetchStreamUrl: () => Promise<void>,
  playerCallbacks: PlayerCallbacks
): PlayerInterface {
  // Whether we are currently reloading the video
  let reloadInProgress = false;
  let peerSignalingResponded = false;
  let peerResponseTimeoutId: NodeJS.Timeout | undefined = undefined;
  let reloadTimeoutId: NodeJS.Timeout | undefined = undefined;

  // This is a signer to our own backend
  const signer: RequestSigner = {
    getSignedURL: (signalingEndpoint: string, queryParams: QueryParams) => {
      return KinesisApiPublicService.signWebrtcRequest({
        sign_token,
        wss_url: signalingEndpoint,
        headers: queryParams,
      });
    },
  };

  // This client is used to send/receive signaling messages
  const signalingClient = new SignalingClient({
    channelARN: data.channel_info.channel_arn,
    channelEndpoint: data.channel_info.wss_endpoint,
    role: Role.VIEWER,
    region: "us-west-2",
    clientId: data.client_id,
    requestSigner: signer,
    // TODO(@lberg): check if this is needed
    // systemClockOffset: kinesisVideoClient.config.systemClockOffset,
  });

  const peerConnection = new RTCPeerConnection({
    iceServers: data.ice_servers,
    iceTransportPolicy: "all",
  });

  const reloadVideo = () => {
    if (reloadInProgress) {
      return;
    }
    reloadInProgress = true;
    // when the document is hidden, we don't want to reload the video
    // as the keep-alive are not sent. Still, we want to reload the video
    //  when the document is visible again.
    if (document.visibilityState === "hidden") {
      reloadInProgress = false;
      reloadTimeoutId = setTimeout(reloadVideo, REFETCH_TIMEOUT_MS);
      return;
    }
    console.debug("[WEBRTC] Reloading video");
    playerCallbacks.onVideoReload();
    refetchStreamUrl()
      .catch((error) => {
        const error_msg = JSON.stringify(error);
        console.error(`Error refetching stream url: ${error_msg}, will retry`);
        reloadTimeoutId = setTimeout(reloadVideo, REFETCH_TIMEOUT_MS);
      })
      .finally(() => {
        reloadInProgress = false;
      });
  };

  signalingClient.on("open", async () => {
    const ice_servers_msg = JSON.stringify(data.ice_servers);
    console.debug("[WEBRTC] Connected to signaling service", ice_servers_msg);

    // NOTE(@lberg): this is a hack to make webrtc to collect candidate on iOS
    // inspired by https://github.com/web-platform-tests/wpt/issues/7424
    // However, we have to run it for Safari too, so it's just easier
    // to run it for all browsers.
    attachWarmUpAudioStream(peerConnection);
    attachWarmUpVideoStream(peerConnection);

    // Create an SDP offer to send to the master
    await peerConnection.setLocalDescription(
      await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
    );
    if (!isDefined(peerConnection.localDescription)) {
      console.error("[WEBRTC] Local description is not defined, aborting");
      return;
    }
    signalingClient.sendSdpOffer(peerConnection.localDescription);

    peerResponseTimeoutId = setTimeout(() => {
      if (!peerSignalingResponded) {
        // After WAIT_PEER_SIGNALING_TIMEOUT_S seconds, if we didn't receive
        // any signaling message from the MASTER, we reload the video. Otherwise
        // there's a risk that the MASTER is not aware of our connection and
        // we will not receive any video.
        console.warn(
          "[WEBRTC] Reload the video since new signaling did not receive a response for long."
        );
        reloadVideo();
      }
    }, WAIT_PEER_SIGNALING_TIMEOUT_S * 1000);
  });

  signalingClient.on("sdpAnswer", async (answer) => {
    const msg = JSON.stringify(answer);
    console.debug("[WEBRTC] Received SDP answer:" + msg);
    peerSignalingResponded = true;
    // Add the SDP answer to the peer connection
    await peerConnection.setRemoteDescription(answer);
  });

  signalingClient.on("iceCandidate", (candidate) => {
    const msg = JSON.stringify(candidate);
    console.debug("[WEBRTC] Received ICE candidate", msg);
    peerSignalingResponded = true;
    // Add the ICE candidate received from the MASTER to the peer connection
    peerConnection.addIceCandidate(candidate);
  });

  signalingClient.on("close", () => {
    console.debug("[WEBRTC] Disconnected from signaling channel");
  });

  signalingClient.on("error", (error) => {
    const err_msg = JSON.stringify(error);
    console.error("[WEBRTC] Signaling client error:", err_msg);
  });

  // Send any ICE candidates to the other peer
  peerConnection.addEventListener("icecandidate", ({ candidate }) => {
    if (candidate) {
      const msg = JSON.stringify(candidate);
      console.debug("[WEBRTC] Generated ICE candidate:", msg);
      signalingClient.sendIceCandidate(candidate);
    } else {
      console.debug("[WEBRTC] All ICE candidates have been generated");
    }
  });

  peerConnection.addEventListener("connectionstatechange", async () => {
    const msg = JSON.stringify(peerConnection.connectionState);
    console.debug("[WEBRTC] Connection state change:", msg);

    if (
      peerConnection.connectionState === "disconnected" ||
      peerConnection.connectionState === "failed"
    ) {
      console.error("[WEBRTC] Peer connection lost");
      if (!reloadInProgress) {
        reloadVideo();
      }
    }
  });

  // As remote tracks are received, add them to the video player
  peerConnection.addEventListener("track", (event) => {
    console.debug("[WEBRTC] Received remote track");
    peerSignalingResponded = true;
    if (isDefined(video.srcObject) || event.streams.length === 0) {
      return;
    }
    video.srcObject = event.streams[0];
    playerCallbacks.onSourceLoaded();
  });

  video.onplaying = () => playerCallbacks.onVideoStartedPlay();
  video.onpause = () => playerCallbacks.onVideoPaused();

  video.onerror = () => {
    const errorCode = video.error?.code;
    const errorMsg = video.error?.message;
    console.error(
      `[WEBRTC] Error loading ${videoName} code=(${errorCode}) msg=${errorMsg}.`
    );
    console.error("[WEBRTC] recovery still not implemented");
  };

  const timeKeeper = new WebRtcTimeKeeper();
  timeKeeper.registerVideoFrameCallback(video);

  console.debug("[WEBRTC] Starting viewer connection");
  signalingClient.open();

  return {
    playingDate: () => timeKeeper.getCurrentTime(),
    syncLive: () => {
      console.debug("[WEBRTC ]sync live has no effect");
    },
    videoElement: video,
    cleanup: () => {
      video.onplaying = () => ({});
      video.onerror = () => ({});
      video.pause();
      video.srcObject = null;
      signalingClient.close();
      peerConnection.close();
      if (isDefined(peerResponseTimeoutId)) {
        clearTimeout(peerResponseTimeoutId);
      }
      if (isDefined(reloadTimeoutId)) {
        clearTimeout(reloadTimeoutId);
      }
    },
    reloadVideo,
  };
}

function attachWarmUpAudioStream(peerConnection: RTCPeerConnection) {
  const silence = () => {
    const ctx = new AudioContext(),
      oscillator = ctx.createOscillator();
    const dst = oscillator.connect(
      ctx.createMediaStreamDestination()
    ) as MediaStreamAudioDestinationNode;
    oscillator.start();
    return dst.stream.getAudioTracks()[0];
  };
  const audioStream = new MediaStream([silence()]);

  audioStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, audioStream);
  });
  // remove the audio stream from the DOM
  audioStream.getTracks().forEach((track) => {
    track.stop();
  });
}

function attachWarmUpVideoStream(peerConnection: RTCPeerConnection) {
  const canvas = Object.assign(document.createElement("canvas"), {
    width: 640,
    height: 480,
  });
  const videoStream = canvas.captureStream();
  // attach the canvas to the DOM to collect ICE candidates
  videoStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, videoStream);
  });
  // remove the canvas from the DOM
  videoStream.getTracks().forEach((track) => {
    track.stop();
  });
  canvas.remove();
}

// Check if the video is stuck by looking at the video time and reload if true.
export function useHandleMinimize(
  player: PlayerInterface | undefined,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    async function handleMinimize() {
      if (!isDefined(player)) {
        return;
      }

      if (document.visibilityState === "hidden") {
        player.videoElement.pause();
      } else if (document.visibilityState === "visible") {
        player.reloadVideo?.();
      }
    }

    document.addEventListener("visibilitychange", handleMinimize);
    return () => {
      document.removeEventListener("visibilitychange", handleMinimize);
    };
  }, [player, enabled]);
}
