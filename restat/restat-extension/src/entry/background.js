import { addBid, addConnect, addLead, authenticateUser, updateBid } from "../provider";
import { ALARMS, MESSAGES } from "../constants";

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    // Wait for 1 second before opening the URL
    setTimeout(() => {
      chrome.tabs.create({ url: "https://app.restat.io" });
    }, 1000);
  }
  // Initialize storage with default values
  await chrome.storage.sync.set({ bids: [] });
  await chrome.storage.sync.set({ bidder: "" });
  await chrome.storage.sync.set({ permissions: "" });
  await chrome.storage.sync.set({ company: "" });
  createDailyAlarm();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARMS.DAILY_UPDATE) {
    chrome.tabs.query(
      {
        active: true,
        url: ["https://www.upwork.com/*", "https://www.linkedin.com/*"],
      },
      (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, {
            sent: MESSAGES.UPDATE_COUNT,
          });
        });
      }
    );
  }
});

function updateBadge(count) {
  chrome.action.setBadgeText({ text: count.toString() });
  chrome.action.setBadgeBackgroundColor({ color: '#1a4895' }); // Optional: Set the badge background color
}

function handleTabsMessage(request) {
  chrome.tabs.query(
    {
      url: ["https://www.upwork.com/*", "https://www.linkedin.com/*"],
    },
    (allTabs) => {
      allTabs.forEach((tab) => {
        // Send a message to each tab
        chrome.tabs.sendMessage(
          tab.id,
          {
            sent: request.message,
            message: "success",
          },
        );
      });
    }
  );
}

function sendTheResponse(request, response) {
  chrome.tabs.query(
    {
      active: true,
      url: ["https://www.upwork.com/*", "https://www.linkedin.com/*"],
    },
    (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          sent: request.message,
          data: response,
        });
      });
    }
  );
}

function createDailyAlarm() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); 
  const timeToMidnight = midnight.getTime() - now.getTime();
  chrome.alarms.create(ALARMS.DAILY_UPDATE, {
    when: Date.now() + timeToMidnight,
    periodInMinutes: 1440 // 24 hours
  });
}

// eslint-disable-next-line
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  let body = request.object;
  let response = "";
  
  try {
    if (request.message === MESSAGES.SYNC_PROPOSAL) {
      response = await addBid(body);
    } else if (request.message === MESSAGES.SYNC_LEAD) {
      response = await updateBid(body);
    } else if (request.message === MESSAGES.SYNC_CONTRACT) {
      response = await addLead(body);
    } else if (request.message === MESSAGES.SYNC_CONNECT) {
      response = await addConnect(body);
    } else if (request.message === MESSAGES.SYNC_PROSPECT) {
      response = await addConnect(body);
    } else if (request.message === MESSAGES.ADD_BUTTONS) {
      handleTabsMessage(request)
    } else if (request.message === MESSAGES.REMOVE_BUTTONS) {
      handleTabsMessage(request)
    }
    else if (request.message === MESSAGES.UPDATE_UPWORK_PROFILE) {
      handleTabsMessage(request)
    }
    else if (request.message === MESSAGES.UPDATE_LINKEDIN_PROFILE) {
      handleTabsMessage(request)
    }
    else if (request.message === MESSAGES.SHOW_SIDE_PANEL) {
      chrome.tabs.query(
        {
          active: true,
        },
        (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {
              sent: MESSAGES.SHOW_SIDE_PANEL,
              message: "success",
            });
          });
        }
      );
    } else if (request.message === MESSAGES.ADD_COVER_LETTER_TEMPLATE) {
      chrome.tabs.query(
        {
          active: true,
          url: ["https://www.upwork.com/*", "https://www.linkedin.com/*"],
        },
        (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {
              sent: MESSAGES.ADD_COVER_LETTER_TEMPLATE,
              template: request.template,
            });
          });
        }
      );
    } else if (request.message === MESSAGES.ALERT_CURRENT_TAB) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.scripting.executeScript(
            {
              target: { tabId: tabs[0].id },
              func: () => {
                alert("Go to any Upwork or Linkedin page and refresh the page to load the extension.");
              },
            },
          );
        }
      });
    } else if (request.message === MESSAGES.UPDATE_BADGE) {
      updateBadge(request?.count)
    } else  if (request.action === MESSAGES.SOCIAL_LOGIN) {
      // Handle the message as needed
      const { user, token } = request.data
      await authenticateUser(null, {user, token})
      response = {
        action: request.action,
        message: 'Logged in Successfully.'
      }
    } else if (request.message === MESSAGES.LOGIN_SUCCESS) {
      handleTabsMessage(request)
    } 

    if (response?.message || response?.error) {
      sendTheResponse(request, response)
    }

  } catch (e) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { sent: "error", data: e });
    });
  }
  return true;
});
