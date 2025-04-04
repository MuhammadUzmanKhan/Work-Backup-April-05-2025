import { BUTTONS, BUTTON_NAMES, MESSAGES, PATTERNS, STORAGE, TABS, TARGET } from "@/constants";
import { addButton, captureExtensionError, handleRuntimeMessage, handleSyncProfile, removeButtonInLinkedin } from "./parserHelper";
import { syncMessages } from "../../features.json";
import moment from "moment";

const setInitials = async () => {
    const bidderObj = await chrome.storage.sync.get(["bidder"]);
    const bidder = bidderObj.bidder;
    const initials = bidderObj.bidder
        ? bidderObj.bidder.charAt(0).toUpperCase()
        : "";
    return { bidder, initials }
}

const getBidCount = async () => {
    const bidDailyCount = await chrome.storage.sync.get([STORAGE.BID_DAILY_COUNT]);
    const bidMonthlyCount = await chrome.storage.sync.get([STORAGE.BID_MONTHLY_COUNT,]);
    const leadDailyCount = await chrome.storage.sync.get([STORAGE.LEAD_DAILY_COUNT]);
    const leadMonthlyCount = await chrome.storage.sync.get([STORAGE.LEAD_MONTHLY_COUNT,]);
    const upworkTarget = await chrome.storage.sync.get([STORAGE.UPWORK_TARGET])
    let upworkTargetMonthly = upworkTarget?.upworkTarget
    let upworkTargetDaily = Math.ceil(upworkTargetMonthly / moment().daysInMonth());
    const bidMonthlyCountByBidder = bidMonthlyCount.bidMonthlyCount ?? 0;
    const bidDailyCountByBidder = bidDailyCount.bidDailyCount ?? 0;
    const leadMonthlyCountByBidder = leadMonthlyCount.leadMonthlyCount ?? 0;
    const leadDailyCountByBidder = leadDailyCount.leadDailyCount ?? 0;
    if (!upworkTargetMonthly) {
        upworkTargetMonthly = TARGET.UNSET
    }
    if (!upworkTargetDaily) {
        upworkTargetDaily = TARGET.UNSET
    }
    return { bidDailyCountByBidder, bidMonthlyCountByBidder, leadMonthlyCountByBidder, leadDailyCountByBidder, upworkTargetMonthly, upworkTargetDaily }
}

const getDefaultTab = async () => {
    let defaultTab = "";
    const settings = await chrome.storage.sync.get([STORAGE.SETTINGS])
    if (settings.settings) {
        defaultTab = settings.settings.defaultTab;
    } else {
        defaultTab = TABS.UPWORK
    }
    return { defaultTab, settings }
}

const getLinkedinConnectCount = async () => {
    const linkedinConnectDailyCount = await chrome.storage.sync.get([STORAGE.LINKEDIN_CONNECT_DAILY_COUNT]);
    const linkedinConnectMonthlyCount = await chrome.storage.sync.get([STORAGE.LINKEDIN_CONNECT_MONTHLY_COUNT]);
    const linkedinProspectDailyCount = await chrome.storage.sync.get([STORAGE.LINKEDIN_PROSPECT_DAILY_COUNT]);
    const linkedinProspectMonthlyCount = await chrome.storage.sync.get([STORAGE.LINKEDIN_PROSPECT_MONTHLY_COUNT]);
    const linkedinTarget = await chrome.storage.sync.get([STORAGE.LINKEDIN_TARGET])

    let linkedinTargetMonthly = linkedinTarget?.linkedinTarget
    let linkedinTargetDaily = Math.ceil(linkedinTargetMonthly / moment().daysInMonth());
    const linkedinConnectMonthlyCountByBidder = linkedinConnectMonthlyCount.linkedinConnectMonthlyCount ?? 0;
    const linkedinConnectDailyCountByBidder = linkedinConnectDailyCount.linkedinConnectDailyCount ?? 0;
    const linkedinProspectMonthlyCountByBidder = linkedinProspectMonthlyCount.linkedinProspectMonthlyCount ?? 0;
    const linkedinProspectDailyCountByBidder = linkedinProspectDailyCount.linkedinProspectDailyCount ?? 0;
    if (!linkedinTargetMonthly) {
        linkedinTargetMonthly = TARGET.UNSET
    }
    if (!linkedinTargetDaily) {
        linkedinTargetDaily = TARGET.UNSET
    }
    return { linkedinConnectDailyCountByBidder, linkedinConnectMonthlyCountByBidder, linkedinProspectMonthlyCountByBidder, linkedinProspectDailyCountByBidder, linkedinTargetMonthly, linkedinTargetDaily }
}

const clickOutsideExtension = (extensionMain, rsLogo, event, handleLayoutContainerClick, bidder) => {
    const antToolTip = document.querySelector(".ant-tooltip-inner");
    let isClassShared = false;
    if (antToolTip && event.target) {
        for (let className of event.target.classList) {
            if (antToolTip.classList.contains(className)) {
                isClassShared = true;
                break;
            }
        }
    }
    if (
        extensionMain &&
        !extensionMain.contains(event.target) && rsLogo &&
        !rsLogo.contains(event.target) && !isClassShared
    ) {
        handleLayoutContainerClick();

        // Show rsLogo again
        if (rsLogo) {
            rsLogo.style.display = "flex";
        }

        if (PATTERNS.LINKEDIN.test(window.location.href)) {
            setTimeout(() => {
                addRemoveButtonsDynamically(bidder)
            }, 2000)
        }
    }
}

const addRemoveButtonsDynamically = (bidder) => {
    const syncButton = document.querySelector(`.${BUTTONS.SYNC_CONNECT}`);
    if (bidder !== "") {
        if (PATTERNS.LINKEDIN_PROFILE.test(window.location.href)) {
            if (!syncButton) {
                addButton(BUTTON_NAMES.SYNC_CONNECT, MESSAGES.SYNC_CONNECT, handleSyncProfile);
                addButton(BUTTON_NAMES.SYNC_PROSPECT, MESSAGES.SYNC_PROSPECT, handleSyncProfile);
                if (syncMessages.switch) {
                    addButton(BUTTON_NAMES.SYNC_MESSAGES, MESSAGES.SYNC_MESSAGES, handleSyncProfile);
                }
            }
        }
        else if (PATTERNS.LINKEDIN.test(window.location.href)) {
            if (syncButton) {
                removeButtonInLinkedin(MESSAGES.SYNC_CONNECT); // Remove buttons if we navigate away
                removeButtonInLinkedin(MESSAGES.SYNC_PROSPECT);
                if (syncMessages.switch) {
                    removeButtonInLinkedin(MESSAGES.SYNC_MESSAGES);
                }
            }
        }
    } else {
        if (syncButton) {
            removeButtonInLinkedin(MESSAGES.SYNC_CONNECT); // Remove buttons if session expired
            removeButtonInLinkedin(MESSAGES.SYNC_PROSPECT);
            if (syncMessages.switch) {
                removeButtonInLinkedin(MESSAGES.SYNC_MESSAGES);
            }
        }
    }
}

const logoutSetup = async () => {
    const bidder = {};
    bidder.bidder = "";
    const userToken = {};
    userToken.userToken = "";
    const settings = {};
    settings.settings = "";
    const linkedinConnectDailyCount = {}
    linkedinConnectDailyCount.linkedinConnectDailyCount = 0
    const linkedinConnectMonthlyCount = {}
    linkedinConnectMonthlyCount.linkedinConnectMonthlyCount = 0
    const bidDailyCount = {}
    bidDailyCount.bidDailyCount = 0
    const bidMonthlyCount = {}
    bidMonthlyCount.bidMonthlyCount = 0

    await chrome.storage.sync.set(bidder);
    await chrome.storage.sync.set(userToken);
    await chrome.storage.sync.set(settings);
    await chrome.storage.sync.set(linkedinConnectDailyCount)
    await chrome.storage.sync.set(linkedinConnectMonthlyCount)
    await chrome.storage.sync.set(bidDailyCount)
    await chrome.storage.sync.set(bidMonthlyCount)
    await chrome.storage.sync.remove(STORAGE.UPWORK_PROFILE)
    await chrome.storage.sync.remove(STORAGE.LINKEDIN_PROFILE)
    await chrome.storage.sync.remove(STORAGE.INDUSTRY)
}

const setUp = async () => {
    try {
        const { defaultTab } = await getDefaultTab()
        const { bidder, initials } = await setInitials();
        const { bidDailyCountByBidder, bidMonthlyCountByBidder, leadMonthlyCountByBidder, leadDailyCountByBidder, upworkTargetMonthly, upworkTargetDaily } = await getBidCount();
        const { linkedinConnectDailyCountByBidder, linkedinConnectMonthlyCountByBidder, linkedinProspectMonthlyCountByBidder, linkedinProspectDailyCountByBidder, linkedinTargetMonthly, linkedinTargetDaily } = await getLinkedinConnectCount();
        if (defaultTab === "UPWORK") {
            handleRuntimeMessage({
                message: MESSAGES.UPDATE_BADGE,
                count: bidDailyCountByBidder
            })
        } else {
            handleRuntimeMessage({
                message: MESSAGES.UPDATE_BADGE,
                count: linkedinConnectDailyCountByBidder
            })
        }
        return {
            defaultTab, bidder, initials, bidDailyCountByBidder, bidMonthlyCountByBidder, leadMonthlyCountByBidder,
            leadDailyCountByBidder, upworkTargetDaily, upworkTargetMonthly, linkedinConnectDailyCountByBidder, linkedinConnectMonthlyCountByBidder, linkedinProspectMonthlyCountByBidder, linkedinProspectDailyCountByBidder, linkedinTargetDaily, linkedinTargetMonthly
        }
    } catch (err) {
        captureExtensionError(err)
    }
}

const formatMessage = (message) => {
    // Split the message at each "✓" or "✗" sign and remove any empty entries
    const parts = message.split(/(✓|✗)/).filter(part => part.trim() !== '');
  
    // Rebuild the message with HTML line breaks
    let formattedMessage = '';
    for (let i = 0; i < parts.length; i += 2) {
      const symbol = parts[i];
      const text = parts[i + 1].trim();
      formattedMessage += `${symbol} ${text}<br>`;
    }
    return formattedMessage.trim();
}

const formatMessageArray = (message) => {
    // Split the message at each "✓" or "✗" sign and remove any empty entries
    const parts = message.split(/(✓|✗)/).filter(part => part.trim() !== '');
  
    // Rebuild the message with HTML line breaks
    let formattedMessage = [];
    for (let i = 0; i < parts.length; i += 2) {
      const symbol = parts[i];
      const text = parts[i + 1].trim();
      formattedMessage.push(`${symbol} ${text}`)
    }
    return formattedMessage;
  }


  

export { setInitials, getBidCount, clickOutsideExtension, getLinkedinConnectCount, logoutSetup, getDefaultTab, setUp, formatMessage, formatMessageArray }