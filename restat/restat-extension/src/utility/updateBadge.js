// Function to update the badge with the daily count
export const updateBadge = (count) => {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#1a4895' }); // Optional: Set the badge background color
  }