import { ElementSize } from "hooks/element_size";
import { isDefined } from "coram-common-utils";

// Get css size such that the video fills the container on one axis,
// without any black padding included in the video size.
export function shouldVideoFillWidth(
  videoSize: ElementSize,
  containerSize: ElementSize
): boolean {
  const videoRatio = videoSize.width / videoSize.height;
  const containerRatio = containerSize.width / containerSize.height;
  if (containerRatio >= videoRatio) {
    return false;
  }
  // We have more height than width, so we want to stretch to fill the container width
  return true;
}

interface WebkitFullscreenElement extends HTMLElement {
  webkitEnterFullscreen: () => void;
  webkitExitFullscreen: () => void;
}

function isWebkitFullscreenElement(
  element: HTMLElement
): element is WebkitFullscreenElement {
  return (
    "webkitEnterFullscreen" in element && "webkitExitFullscreen" in element
  );
}

// It will make the current html element fullscreen if it is not already in fullscreen mode.
// Otherwise, it will exit the fullscreen mode.
export function handleToggleHtmlElementFullScreenMode(
  htmlElement: HTMLElement | null
) {
  if (!isDefined(htmlElement)) {
    return;
  }
  const isElementInFullScreenMode = document.fullscreenElement === htmlElement;
  if (isElementInFullScreenMode) {
    if (isWebkitFullscreenElement(htmlElement)) {
      htmlElement.webkitExitFullscreen();
    } else {
      document.exitFullscreen();
    }
  } else {
    if (isWebkitFullscreenElement(htmlElement)) {
      htmlElement.webkitEnterFullscreen();
    } else {
      htmlElement.requestFullscreen();
    }
  }
}

export function getVideoCenteredIconDimensions(
  videoContainerSize: ElementSize
) {
  const { width } = videoContainerSize;
  const iconTextSize = width / 5;
  return `${Math.max(iconTextSize, 50)}px`;
}
