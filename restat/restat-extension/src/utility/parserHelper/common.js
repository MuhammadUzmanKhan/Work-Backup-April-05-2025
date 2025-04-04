import { removeButtonInLinkedin } from "./linkedinParser";
import { removeButtonInUpwork } from "./upworkParser";
import { syncMessages } from "../../../features.json";
import { MESSAGES, PATTERNS } from "@/constants";
import { notification, Button } from 'ant-design-vue';
import { h } from "vue";
import { logoutSetup } from "..";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const getElementsByText = (str, tag = "a", element = document) => {
  return Array.prototype.slice
    .call(element.getElementsByTagName(tag))
    .filter(
      (el) => el.textContent.trim().toLowerCase() === str.trim().toLowerCase()
    );
};
const getElementsByTextIncludes = (str, tag = "a", element = document) => {
  return Array.prototype.slice
    .call(element.getElementsByTagName(tag))
    .filter((el) =>
      el.textContent.trim().toLowerCase().includes(str.trim().toLowerCase())
    );
};
const getElementsByTextArr = (str, tag = "a", elements = document) => {
  let matchingElements = [];

  elements.forEach((element) => {
    // Filter elements by text content
    const matched = Array.prototype.slice
      .call(element.getElementsByTagName(tag))
      .filter(
        (el) => el.textContent.trim().toLowerCase() === str.trim().toLowerCase()
      );

    matchingElements.push(...matched);
  });

  return matchingElements;
};

const _cleanString = (str) => {
  return str ? str.replaceAll("\n", "").replace(/\s+/g, " ").trim() : "";
};

const _checkBidder = async () => {
  let bidder = await chrome?.storage?.sync?.get(["bidder"]);
  return bidder && bidder.bidder == "";
};

const getNextNonEmptyElementSibling = (element) => {
  let sibling = element.nextElementSibling;
  while (
    sibling &&
    (sibling.nodeType === 8 || sibling.textContent.trim() === "")
  ) {
    sibling = sibling.nextElementSibling;
  }
  return sibling;
};

const getNonEmptyParentElement = (element) => {
  let parent = element.parentElement;
  while (
    parent &&
    (parent.nodeType === 8 || parent.textContent.trim() === "")
  ) {
    parent = parent.parentElement;
  }
  return parent;
};

const addCssToPage = () => {
  var link = document.createElement("link");
  link.href = chrome.runtime.getURL("ps-upwork.css");
  link.type = "text/css";
  link.rel = "stylesheet";
  document.getElementsByTagName("head")[0].appendChild(link);
};

const startLoader = (className) => {
  if (document.querySelector(className)) {
    document.querySelector(className).disabled = true
    document.querySelector(className).classList.add("rs-activeLoading");
  }
};

const stopLoader = (className) => {
  if (document.querySelector(className)) {
    document.querySelector(className).disabled = false
    document.querySelector(className).classList.remove("rs-activeLoading");
  }
};

const extractTimezone = (str) => {
  // Regular expression to match 'GMT' followed by an optional sign and a number, or uppercase letters
  const gmtPattern = /GMT[+-]\d+/;
  const timezonePattern = /[A-Z]{3,}/;

  // Match and extract the timezone part
  const gmtMatch = str.match(gmtPattern);
  const timezoneMatch = str.match(timezonePattern);

  // Return the appropriate match
  return gmtMatch ? gmtMatch[0] : timezoneMatch ? timezoneMatch[0] : null;
};
const handleExtensionError = async (method) => {
  try {
    await method();
  } catch (error) {
    captureExtensionError(error);
  }
};

const captureExtensionError = async (error) => {
  const errorMessage = error.message || "";
  const pattern = /Extension context invalidated/i;

  if (pattern.test(errorMessage) || error?.status === 440) {
    try {
      // Your cleanup logic
      if (
        !PATTERNS.UPWORK.test(window.location.href) &&
        !PATTERNS.SUBMIT_PROPOSAL.test(window.location.href) &&
        PATTERNS.PROPOSAL_DETAILS.test(window.location.href)
      ) {
        removeButtonInUpwork(MESSAGES.SYNC_PROPOSAL);
        removeButtonInUpwork(MESSAGES.SYNC_LEAD);
        removeButtonInUpwork(MESSAGES.SYNC_CONTRACT);
      }
      if (PATTERNS.LINKEDIN_PROFILE.test(window.location.href)) {
        removeButtonInLinkedin(MESSAGES.SYNC_CONNECT);
        removeButtonInLinkedin(MESSAGES.SYNC_PROSPECT);
        if (syncMessages.switch) {
          removeButtonInLinkedin(MESSAGES.SYNC_MESSAGES);
        }
      }
      if(error?.status === 440){
        await logoutSetup()
        openNotificationWithIcon("error", error.message, 'top');
        return
      }

      const extensionMenu = document.getElementById("extension-menu-container");
      if (extensionMenu) {
        document.body.removeChild(extensionMenu);
      }
      const extensionMenuOtherPages = document.getElementById(
        "extension-menu-container-other-pages"
      );
      if (extensionMenuOtherPages) {
        document.body.removeChild(extensionMenuOtherPages);
      }
      const extensionMenuLinkedin = document.getElementById(
        "extension-menu-container-linkedin"
      );
      if (extensionMenuLinkedin) {
        document.body.removeChild(extensionMenuLinkedin);
      }
    } catch (_) {
      console.log("Cleanup failed");
    }
  } 
};

const errorHandler = (app) => {
  app.config.errorHandler = (err) => {
    captureExtensionError(err);
  };
};

const handleRuntimeMessage = (messageObject) => {
  chrome?.runtime?.sendMessage(messageObject, () => {
    if (chrome.runtime.lastError) {
      captureExtensionError(chrome.runtime.lastError);
    }
  });
}

const openNotificationWithIcon = (type, description, placement= 'topRight', message='') => {
  notification[type]({
    message,
    description,
    placement,
    maxCount: 1,
  });
};

const openNotification = (type = 'info', description, buttonColor = '#EE3A23') => {
  const key = `open${Date.now()}`;
  notification[type]({
    description,
    btn: () =>
      h(
        Button,
        {
          style: { backgroundColor: buttonColor, borderColor: buttonColor, color: '#fff' }, // Apply custom color
          size: 'small',
          onClick: () => notification.close(key),
        },
        { default: () => 'Confirm' },
      ),
    key,
    duration: null,
  });
};

export {
  delay,
  getElementsByText,
  _cleanString,
  addCssToPage,
  startLoader,
  stopLoader,
  getNextNonEmptyElementSibling,
  getNonEmptyParentElement,
  getElementsByTextArr,
  getElementsByTextIncludes,
  extractTimezone,
  _checkBidder,
  errorHandler,
  captureExtensionError,
  handleExtensionError,
  handleRuntimeMessage,
  openNotificationWithIcon,
  openNotification
};
