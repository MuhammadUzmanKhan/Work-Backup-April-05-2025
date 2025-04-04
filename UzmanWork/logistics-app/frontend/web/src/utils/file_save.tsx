import { Duration } from "luxon";

const REVOKE_LINK_TIMEOUT = Duration.fromObject({ seconds: 40 });

export function downloadLocalFile(
  data: string,
  fileName: string,
  mimeType: string
) {
  const blob = new Blob([data], { type: mimeType });
  downloadLocalBlob(blob, fileName);
}

export function downloadLocalBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    window.URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
  }, REVOKE_LINK_TIMEOUT.as("milliseconds"));
}

export async function initiateFileDownload(url: string, fileName: string) {
  const response = await fetch(url);
  if (!response.ok) {
    console.log(`Failed to download the file ${response.status}`);
    throw new Error(`Failed to download the file`);
  }
  const blob = await response.blob();
  downloadLocalBlob(blob, fileName);
}
