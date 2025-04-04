import { HlsConfig } from "hls.js";
import { isDefined } from "./types";
import { DateTime } from "luxon";
import { formatDateTime } from "./dates";
import { WallLayout } from "components/wall/WallLayoutSelector";

const EMAILS_CLIPBOARD_KEY = "emails_clipboard";
const DEBUG_HLS_CONFIG_KEY = "debug_hls_config";
const LAST_USER_ACTIVITY_KEY = "lastUserActivity";
const LIVE_WALL_LAYOUT_KEY = "liveWallLayout";

export function setEmailsInStorage(emails: string[]) {
  sessionStorage.setItem(EMAILS_CLIPBOARD_KEY, emails.join(","));
}

export function getEmailsInStorage() {
  const emails = sessionStorage.getItem(EMAILS_CLIPBOARD_KEY);
  return emails !== null ? emails.split(",") : [];
}

export function getHlsConfigInStorage() {
  const hls_config = sessionStorage.getItem(DEBUG_HLS_CONFIG_KEY);
  if (!isDefined(hls_config)) {
    return undefined;
  }
  return JSON.parse(hls_config) as Partial<HlsConfig>;
}

export function setLastUserActivity(currentTime: DateTime) {
  localStorage.setItem(LAST_USER_ACTIVITY_KEY, formatDateTime(currentTime));
}

export function getLastUserActivity() {
  const lastUserActivity = localStorage.getItem(LAST_USER_ACTIVITY_KEY);
  return lastUserActivity !== null ? DateTime.fromISO(lastUserActivity) : null;
}

export function setLiveWallLayoutInSession(layout: WallLayout) {
  sessionStorage.setItem(LIVE_WALL_LAYOUT_KEY, layout.toString());
}

export function getLiveWallLayoutFromSession(): WallLayout {
  const storedLayout = sessionStorage.getItem(LIVE_WALL_LAYOUT_KEY);
  if (storedLayout == null) {
    return WallLayout.ThreeByThree;
  }

  for (const layout of Object.values(WallLayout)) {
    if (layout.toString() === storedLayout) {
      return layout as WallLayout;
    }
  }
  return WallLayout.ThreeByThree;
}
