export const ytFormatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const hDisplay = h > 0 ? `${h}h ` : "";
  const mDisplay = `${m} min `;
  const sDisplay = `${s} sec`;

  if (hDisplay) {
    return `${hDisplay}${mDisplay}${sDisplay}`.trim();
  } else if (m > 0) {
    return `${mDisplay}${sDisplay}`.trim();
  } else {
    return sDisplay.trim();
  }
};

export const fbFormatDuration = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const hDisplay = h > 0 ? `${h}h ` : "";
  const mDisplay = `${m} min `;
  const sDisplay = `${s} sec`;

  if (hDisplay) {
    return `${hDisplay}${mDisplay}${sDisplay}`.trim();
  } else if (m > 0) {
    return `${mDisplay}${sDisplay}`.trim();
  } else {
    return sDisplay.trim();
  }
};
