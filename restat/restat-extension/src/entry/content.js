import { syncMessages } from "../../features.json";
import {
  getElementsByText,
  startLoader,
  stopLoader,
  populateJobDetails,
  populateBidDetails,
  addButtonToPage,
  expandTextDescriptions,
  populateBidClientDetails,
  populateBidProfileDetails,
  setBidder,
  populateBoostedDetails,
  populateProposedTerms,
  populateBidResponse,
  addCoverLetterTemplate,
  addButton,
  removeButtonInUpwork,
  removeButtonInLinkedin,
  compareUpworkProfiles,
  loadExtensionInOtherUpworkPage,
  loadExtensionInUpwork,
  loadExtensionInLinkedin,
  _checkBidder,
  addCssToPage,
  handleExtensionErrorInUpwork,
  closeModal,
  loadProfileInUpwork,
  loadProfileInLinkedin,
  handleRuntimeMessage,
  handleSyncProfile,
  openNotificationWithIcon,
  openNotification,
  captureExtensionError
} from "../utility/parserHelper";

import { upworkBidObj } from "../objects";
import { addError } from "@/provider";
import {
  createModal,
  populateConnectsInformation,
  submitProposalButtonClicked,
} from "@/utility/parserHelper/upworkParser";
import { BUTTONS, BUTTON_NAMES, MESSAGES, PATTERNS, TABS } from "@/constants";
import store from "@/store";
import { formatMessageArray, getBidCount, getDefaultTab, getLinkedinConnectCount, logoutSetup } from "@/utility";
import { rollbarThrow } from "@/rollbar";
let expanded = false;
let bid = upworkBidObj;
let lastUrl = window.location.href;
let currentUrl;
// let profile = { ...linkedinProfileObj };
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
addCssToPage();

const showButtonsInUpwork = async () => {
  if (await isLoggedIn()) {
    addButtonToPage(BUTTON_NAMES.SYNC_PROPOSAL, MESSAGES.SYNC_PROPOSAL, handleSyncBid);
    addButtonToPage(BUTTON_NAMES.SYNC_LEAD, MESSAGES.SYNC_LEAD, handleSyncBid);
    addButtonToPage(BUTTON_NAMES.SYNC_CONTRACT, MESSAGES.SYNC_CONTRACT, handleSyncBid);
  }
};

const removeAllUpworkButtons = () => {
  removeButtonInUpwork(MESSAGES.SYNC_PROPOSAL);
  removeButtonInUpwork(MESSAGES.SYNC_LEAD);
  removeButtonInUpwork(MESSAGES.SYNC_CONTRACT);
}

const isLoggedIn = async () => {
  try {
    let bidder = await chrome?.storage?.sync?.get(["bidder"]);
    return !!bidder.bidder
  } catch (err) {
    handleExtensionErrorInUpwork(err);
    return false
  }
};

const showButtonInLinkedin = async () => {
  if (await isLoggedIn()) {
    addButton(BUTTON_NAMES.SYNC_CONNECT, MESSAGES.SYNC_CONNECT, handleSyncProfile);
    addButton(BUTTON_NAMES.SYNC_PROSPECT, MESSAGES.SYNC_PROSPECT, handleSyncProfile);
    if (syncMessages.switch) {
      addButton(BUTTON_NAMES.SYNC_MESSAGES, "sync-messages", handleSyncProfile);
    }
  }
};

// Function to check if the URL has changed and take action
function checkUrlAndLog() {
  currentUrl = window.location.href;
  if (
    currentUrl !== lastUrl && (
    (
      PATTERNS.PROPOSAL_EDIT.test(currentUrl) 
      ||
      PATTERNS.PROPOSAL_INSIGHTS.test(currentUrl)
      ||
      PATTERNS.PROPOSAL_DETAILS.test(currentUrl)
  ))
  ) {
    if (PATTERNS.PROPOSAL_EDIT.test(currentUrl) || PATTERNS.PROPOSAL_INSIGHTS.test(currentUrl)) {
      removeAllUpworkButtons();
    } else if (PATTERNS.PROPOSAL_DETAILS.test(currentUrl)) {
      showButtonsInUpwork();
    }
    lastUrl = currentUrl; // Update the lastUrl to the new URL
  }
}

// MutationObserver to detect changes in the <body>
const observer = new MutationObserver(checkUrlAndLog);
observer.observe(document.body, { childList: true, subtree: true });

// Listen for popstate events (back/forward navigation)
window.addEventListener('popstate', checkUrlAndLog);

// Initial check to apply logic on first load
checkUrlAndLog();

if (
  PATTERNS.UPWORK.test(window.location.href) &&
  !PATTERNS.SUBMIT_PROPOSAL.test(window.location.href) &&
  !PATTERNS.PROPOSAL_DETAILS.test(window.location.href) &&
  !PATTERNS.LINKEDIN.test(window.location.href)
) {
  loadExtensionInOtherUpworkPage();
}

if (
  !PATTERNS.SUBMIT_PROPOSAL.test(window.location.href) &&
  !PATTERNS.LINKEDIN.test(window.location.href) &&
  !PATTERNS.PROPOSAL_EDIT.test(window.location.href) &&
  !PATTERNS.PROPOSAL_INSIGHTS.test(window.location.href) &&
  PATTERNS.PROPOSAL_DETAILS.test(window.location.href)
) {
  showButtonsInUpwork();
}

if (PATTERNS.LINKEDIN_PROFILE.test(window.location.href)) {
  showButtonInLinkedin();
}

if (PATTERNS.PROPOSAL_DETAILS.test(window.location.href)) {
  // Select the button element to monitor for text changes
  const buttonSelector = '#main > div.container > div:nth-child(4) > div > div:nth-child(3) > div:nth-child(1) > div > div.span-lg-3 > div.fe-sticky-sidebar > div.d-none.d-lg-block.mb-6x > button.mb-3x.air3-btn.air3-btn-primary.air3-btn-block';
  const buttonElement = document.querySelector(buttonSelector);

  if (buttonElement) {
    // Create a MutationObserver instance
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData' || mutation.type === 'childList') {
          // Check if the button text includes 'Edit proposal'
          const hasEditProposalText = buttonElement.textContent.includes('Edit proposal');
          if(hasEditProposalText){
            showButtonsInUpwork()
          } else {
            removeAllUpworkButtons()
          }
        }
      });
    });

    // Start observing the button's text content
    observer.observe(buttonElement, { characterData: true, childList: true, subtree: true });
  }
}

if (
  PATTERNS.SUBMIT_PROPOSAL.test(window.location.href) ||
  PATTERNS.PROPOSAL_DETAILS.test(window.location.href)
) {
  loadExtensionInUpwork();
}

if (PATTERNS.LINKEDIN.test(window.location.href)) {
  loadExtensionInLinkedin();
}

if (PATTERNS.SUBMIT_PROPOSAL.test(window.location.href)) {
  submitProposalButtonClicked();
}

async function syncBidDetails(requestType) {
  bid = await populateJobDetails(bid);
  bid = await populateBidDetails(bid);
  bid = populateBidProfileDetails(bid);
  bid = populateBidClientDetails(bid);
  bid = populateBoostedDetails(bid);
  bid = await populateProposedTerms(bid);
  bid = populateBidResponse(bid);
  bid = await setBidder(bid);
  bid = await populateConnectsInformation(bid);
  const rawHtml = document.querySelector("main").outerHTML;
  bid.rawHtml = rawHtml
  if (bid.bidResponse && !bid.response.date) {
    openNotificationWithIcon("warning", "Lead is not synced. Please refresh the page and try again.");
    document.querySelector(`.restat-upwork-${requestType}-button`).disabled = false;
    stopLoader(`.restat-upwork-${requestType}-button`);
    document.querySelector(`.restat-upwork-${requestType}-button`).style.cursor = "not-allowed";
    return;
  }
  handleRuntimeMessage({
    message: requestType,
    object: bid,
  });
}

let loading = false
async function handleSyncBid(requestType = "sync-proposal") {
  try {
    if (loading) {
      return
    }
    loading = true;

    if (await _checkBidder()) {
      openNotificationWithIcon("info", "Please log in to continue!");
      return;
    }

    startLoader(`.restat-upwork-${requestType}-button`);

    if (!expanded) {
      expandTextDescriptions(
        getElementsByText(
          "Job details",
          "h2"
        )[0]?.parentElement?.parentElement?.querySelector?.(
          "div span span button"
        )
      );

      expandTextDescriptions(
        document
          ?.querySelector?.(".fe-job-details .air3-card-section")
          ?.querySelector?.(".air3-truncation-btn")
      );
      await delay(1000);
      expanded = !expanded;
    }

    const { bidProfile, selectedProfile } = await compareUpworkProfiles();
    if (bidProfile !== selectedProfile) {
      if (selectedProfile === "") {
        openNotificationWithIcon("warning", "Please select a profile.");
      } else {
        openNotificationWithIcon("info",
          `You are logged in with ${bidProfile}'s profile but selected ${selectedProfile}'s profile!`
        );
      }
      stopLoader(`.restat-upwork-${requestType}-button`);
    } else {
      if ([MESSAGES.SYNC_CONTRACT, MESSAGES.SYNC_LEAD].includes(requestType)) {
        if (getElementsByText("Messages", "h2").length) {
          document.querySelector(`.restat-upwork-${requestType}-button`).disabled = true;
          await syncBidDetails(requestType)
        } else {
          openNotificationWithIcon("info", `${requestType === MESSAGES.SYNC_CONTRACT ? 'Contract' : 'Lead'} could not be synced as no response was received from Upwork.`);
          stopLoader(`.restat-upwork-${requestType}-button`);
        }
      } else {
        document.querySelector(`.restat-upwork-${requestType}-button`).disabled = true;
        await syncBidDetails(requestType)
      }
    }
  } catch (err) {
    stopLoader(`.restat-upwork-${requestType}-button`);
    document.querySelector(`.restat-upwork-${requestType}-button`).disabled = false;
    openNotification("error", "There was a temporary issue syncing your action. Please try again in a few minutes.")
    await addError(err);
    handleExtensionErrorInUpwork(err);
    rollbarThrow.error(err)
  } finally {
    loading = false;
  }
}

async function getLinkedinCount(thisDayConnections, thisMonthConnections, thisDayProspects, thisMonthProspects) {
  const linkedinConnectDailyCount = {};
  linkedinConnectDailyCount.linkedinConnectDailyCount = thisDayConnections
  await chrome.storage.sync.set(linkedinConnectDailyCount);
  const linkedinConnectMonthlyCount = {};
  linkedinConnectMonthlyCount.linkedinConnectMonthlyCount = thisMonthConnections
  await chrome.storage.sync.set(linkedinConnectMonthlyCount);
  const linkedinProspectDailyCount = {};
  linkedinProspectDailyCount.linkedinProspectDailyCount = thisDayProspects
  await chrome.storage.sync.set(linkedinProspectDailyCount);
  const linkedinProspectMonthlyCount = {};
  linkedinProspectMonthlyCount.linkedinProspectMonthlyCount = thisMonthProspects
  await chrome.storage.sync.set(linkedinProspectMonthlyCount);
  const { defaultTab } = await getDefaultTab();
  if (defaultTab === TABS.LINKEDIN) {
    handleRuntimeMessage({
      message: MESSAGES.UPDATE_BADGE,
      count: linkedinConnectDailyCount.linkedinConnectDailyCount
    })
  }
}

async function setBidCount(message) {
  const bidDailyCount = {};
  bidDailyCount.bidDailyCount = message.data.bidDailyCountByBidder;
  await chrome.storage.sync.set(bidDailyCount);
  const bidMonthlyCount = {};
  bidMonthlyCount.bidMonthlyCount = message.data.bidMonthlyCountByBidder;
  await chrome.storage.sync.set(bidMonthlyCount);
  const leadDailyCount = {};
  leadDailyCount.leadDailyCount = message.data.leadDailyCountByBidder;
  await chrome.storage.sync.set(leadDailyCount);
  const leadMonthlyCount = {};
  leadMonthlyCount.leadMonthlyCount = message.data.leadMonthlyCountByBidder;
  await chrome.storage.sync.set(leadMonthlyCount);
}

async function logoutUser(message) {
  if (message.data?.error && message.data.error?.status === 440) {
    openNotificationWithIcon("error", message.data.error.message, 'top');
    await logoutSetup()
    handleRuntimeMessage({
      message: MESSAGES.UPDATE_BADGE,
      count: 0
    })

    // close the right extension bar if user logs out
    const extensionDetailBlock = document.querySelector(
      ".rs-extension-detail-block"
    );
    const extensionDetailBlock2 = document.querySelector(
      ".rs-extension-detail-block2"
    );
    if (extensionDetailBlock2) {
      extensionDetailBlock2.style.display = "none";
    }
    if (extensionDetailBlock) {
      extensionDetailBlock.style.borderRadius = "0 1rem 1rem 0rem";
    }
    // Remove rs-active-tab class from all tabs
    document.querySelectorAll(".rs-li-icon-container").forEach((tab) => {
      tab.classList.remove("rs-active-tab");
    });
    handleRuntimeMessage({ message: MESSAGES.REMOVE_BUTTONS })
  }
}

window.addEventListener("message", (event) => {
  // if (event.source !== window) return; // Only accept messages from the same window
  const message = event.data;
  if (message.action === 'restat-social-login') {
    handleRuntimeMessage(message)
  }
});

// eslint-disable-next-line
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.data?.error && message.data.error?.status === 440) {
    await logoutUser(message)
    return
  }

  if (message.data?.action === MESSAGES.SOCIAL_LOGIN) {
    // openNotificationWithIcon("success", message.data.message ?? 'Login Successfully');
    try {
      await store.dispatch("industries/fetchIndustries");
      await store.dispatch("linkedinProfiles/fetchLinkedinProfiles");
      await store.dispatch("upworkProfiles/fetchUpworkProfiles");
      await store.dispatch("countBids/fetchBids");
      await store.dispatch("countLinkedinConnects/fetchLinkedinConnects");
      handleRuntimeMessage({
        message: MESSAGES.ADD_BUTTONS,
      });
      handleRuntimeMessage({
        message: MESSAGES.UPDATE_UPWORK_PROFILE,
      });
      handleRuntimeMessage({
        message: MESSAGES.UPDATE_LINKEDIN_PROFILE,
      });
      handleRuntimeMessage({
        message: MESSAGES.LOGIN_SUCCESS,
      });
      // await this.setTheDefaultTab();
    } catch (error) {
      console.log('Error Social Login', error);
    }
  }

  if (message.sent === MESSAGES.SYNC_LEAD && message.data.message) {
    await setBidCount(message)
    openNotificationWithIcon("success", <div>
      {formatMessageArray(message.data.message).map(msg => <p>{msg}</p>)}
    </div>, 'topRight', 'Update Successful');
    stopLoader(`.${BUTTONS.SYNC_LEAD}`);
    document.querySelector(`.${BUTTONS.SYNC_LEAD}`).disabled = false
    sendResponse({
      message: MESSAGES.SYNC_LEAD_SUCCESS,
    });
  } else if (message.sent === MESSAGES.SYNC_LEAD && message.data.error) {
    if (message.data.error.message === "Not Found" || message.data.error.status === 404)
      openNotificationWithIcon("error", "Please sync the proposal first!");
    else if (message.data.error?.status !== 440) {
      openNotificationWithIcon("error", message.data.error.message);
    }
    stopLoader(`.${BUTTONS.SYNC_LEAD}`);
    document.querySelector(`.${BUTTONS.SYNC_LEAD}`).disabled = false
    sendResponse({
      message: MESSAGES.SYNC_LEAD_ERROR,
    });
  }

  if (message.sent === MESSAGES.SYNC_PROPOSAL && message.data.message) {
    openNotificationWithIcon("success", "Proposal synced successfully.");
    await setBidCount(message)
    const { defaultTab } = await getDefaultTab()
    if (defaultTab === TABS.UPWORK) {
      handleRuntimeMessage({
        message: MESSAGES.UPDATE_BADGE,
        count: message.data.bidDailyCountByBidder
      })
    }
    stopLoader(`.${BUTTONS.SYNC_PROPOSAL}`);
    document.querySelector(`.${BUTTONS.SYNC_PROPOSAL}`).disabled = false
    sendResponse({
      message: MESSAGES.SYNC_PROPOSAL_SUCCESS,
    });
  } else if (message.sent === MESSAGES.SYNC_PROPOSAL && message.data.error) {
    if (message.data.error.status === 409) {
      openNotificationWithIcon("info", "The proposal has already been synced.");
    } else if (message.data.error?.status !== 440) {
      openNotificationWithIcon("error", message.data.error.message ?? 'Error Occurred');
    }
    stopLoader(`.${BUTTONS.SYNC_PROPOSAL}`);
    document.querySelector(`.${BUTTONS.SYNC_PROPOSAL}`).disabled = false
    sendResponse({
      message: MESSAGES.SYNC_PROPOSAL_ERROR,
    });
  }

  if (message.sent === MESSAGES.SYNC_CONTRACT && message.data.message) {
    const { modal, overlay } = createModal(message.data?.message);
    overlay.addEventListener("click", () => {
      closeModal(modal, overlay);
    });
    const undoBtn = document.getElementById("undo-btn");
    if (undoBtn) {
      undoBtn.addEventListener("click", async () => {
        await syncBidDetails();
        handleRuntimeMessage({
          message: MESSAGES.SYNC_LEAD,
          object: bid,
        })
      });
    }
    await setBidCount(message)
    stopLoader(`.${BUTTONS.SYNC_CONTRACT}`);
    document.querySelector(`.${BUTTONS.SYNC_CONTRACT}`).disabled = false
    sendResponse({
      message: MESSAGES.SYNC_CONTRACT_SUCCESS,
    });
  } else if (message.sent === MESSAGES.SYNC_CONTRACT && message.data.error) {
    if (message.data.error.status === 409) {
      openNotificationWithIcon("error", "Contract could not be synced as no response was received from Upwork!");
    } else if (message.data.error.message === "Not Found" || message.data.error.status === 404) {
      openNotificationWithIcon("error", "Please sync the proposal first!");
    } else if (message.data.error?.status !== 440) {
      openNotificationWithIcon("error", message.data.error.message);
    }
    stopLoader(`.${BUTTONS.SYNC_CONTRACT}`);
    document.querySelector(`.${BUTTONS.SYNC_CONTRACT}`).disabled = false
    sendResponse({
      message: MESSAGES.SYNC_CONTRACT_ERROR,
    });
  }

  if (message.sent === MESSAGES.SYNC_CONNECT && message.data.message) {
    openNotificationWithIcon("success", message.data.message);
    getLinkedinCount(message.data.thisDayConnections, message.data.thisMonthConnections, message.data.thisDayProspects, message.data.thisMonthProspects);
    stopLoader(`.${BUTTONS.SYNC_CONNECT}`);
    document.querySelector(`.${BUTTONS.SYNC_CONNECT}`).disabled = false
    sendResponse({
      message: MESSAGES.SYNC_CONNECT_SUCCESS,
    });
  } else if (message.sent === MESSAGES.SYNC_CONNECT && message.data.error) {
    if (message.data.error?.status !== 440) openNotificationWithIcon("error", message.data.error.message);
    stopLoader(`.${BUTTONS.SYNC_CONNECT}`);
    document.querySelector(`.${BUTTONS.SYNC_CONNECT}`).disabled = false
    sendResponse({
      message: MESSAGES.SYNC_CONNECT_ERROR,
    });
  }

  if (message.sent === MESSAGES.SYNC_PROSPECT && message.data.message) {
    openNotificationWithIcon("success", message.data.message);
    getLinkedinCount(message.data.thisDayConnections, message.data.thisMonthConnections, message.data.thisDayProspects, message.data.thisMonthProspects);
    stopLoader(`.${BUTTONS.SYNC_PROSPECT}`);
    document.querySelector(`.${BUTTONS.SYNC_PROSPECT}`).disabled = false
    sendResponse({
      message: MESSAGES.SYNC_PROSPECT_SUCCESS,
    });
  } else if (message.sent === MESSAGES.SYNC_PROSPECT && message.data.error) {
    if (message.data.error?.status !== 440) openNotificationWithIcon("error", message.data.error.message);
    stopLoader(`.${BUTTONS.SYNC_PROSPECT}`);
    document.querySelector(`.${BUTTONS.SYNC_PROSPECT}`).disabled = false
    sendResponse({
      message: MESSAGES.SYNC_PROSPECT_ERROR,
    });
  }

  if (message.sent === MESSAGES.ADD_COVER_LETTER_TEMPLATE && message.template) {
    addCoverLetterTemplate(message.template);
    sendResponse({
      message: MESSAGES.ADD_COVER_LETTER_TEMPLATE_SUCCESS,
    });
  }

  if (message.sent === MESSAGES.ADD_BUTTONS) {
    if (
      !PATTERNS.SUBMIT_PROPOSAL.test(window.location.href) &&
      !PATTERNS.LINKEDIN.test(window.location.href) &&
      !PATTERNS.PROPOSAL_EDIT.test(window.location.href) &&
      PATTERNS.PROPOSAL_DETAILS.test(window.location.href)
    ) {
      showButtonsInUpwork()
    } else if (PATTERNS.LINKEDIN_PROFILE.test(window.location.href)) {
     showButtonInLinkedin()
    }
    sendResponse({ message: MESSAGES.ADD_BUTTONS_SUCCESS });
  }

  if (message.sent === MESSAGES.LOGIN_SUCCESS) {
    openNotificationWithIcon("success", 'Login Successfully.');
  }

  if (message.sent === MESSAGES.REMOVE_BUTTONS) {
    if (!PATTERNS.SUBMIT_PROPOSAL.test(window.location.href) &&
      !PATTERNS.LINKEDIN.test(window.location.href) &&
      PATTERNS.PROPOSAL_DETAILS.test(window.location.href)) {
      removeAllUpworkButtons()
    } else if (PATTERNS.LINKEDIN_PROFILE.test(window.location.href)) {
      removeButtonInLinkedin(MESSAGES.SYNC_CONNECT);
      removeButtonInLinkedin(MESSAGES.SYNC_PROSPECT);
      if (syncMessages.switch) {
        removeButtonInLinkedin(MESSAGES.SYNC_MESSAGES);
      }
    }
    sendResponse({ message: MESSAGES.REMOVE_BUTTONS_SUCCESS });
  }

  if (message.sent === MESSAGES.SHOW_SIDE_PANEL) {
    const extensionMain = document.querySelector(".rs-extension-main");
    const extensionMainLinkedin = document.querySelector(".rs-extension-main-linkedin");
    const rsLogo = document.querySelector(".rs-logo-container");
    const rsLogoLinkedin = document.querySelector(".rs-logo-container-linkedin");
    if (extensionMain) {
      extensionMain.style.left = "0rem";
    }
    if (extensionMainLinkedin) {
      extensionMainLinkedin.style.left = "0rem";
    }
    if (rsLogo) {
      rsLogo.style.display = "none";
    }
    if (rsLogoLinkedin) {
      rsLogoLinkedin.style.display = "none";
    }
    document.querySelector("#rs-user-icon")?.click();
  }

  if (message.sent === MESSAGES.CHECK_CONTENT_SCRIPT) {
    handleRuntimeMessage({ message: MESSAGES.CONTENT_SCRIPT_LOADED })
  }

  if (message.sent === MESSAGES.UPDATE_UPWORK_PROFILE && PATTERNS.UPWORK.test(window.location.href)) {
    await loadProfileInUpwork();
  }

  if (message.sent === MESSAGES.UPDATE_LINKEDIN_PROFILE && PATTERNS.LINKEDIN.test(window.location.href)) {
    await loadProfileInLinkedin();
  }

  if (message.sent === MESSAGES.UPDATE_COUNT) {
    const bidder = await chrome?.storage?.sync?.get(["bidder"]);
    const defaultTab = await getDefaultTab()
    if (bidder.bidder !== "") {
      await store.dispatch("countBids/fetchBids");
      await store.dispatch(
        "countLinkedinConnects/fetchLinkedinConnects"
      );
      if (defaultTab.defaultTab === "UPWORK") {
        const { bidDailyCountByBidder } = await getBidCount();
        handleRuntimeMessage({
          message: MESSAGES.UPDATE_BADGE,
          count: bidDailyCountByBidder
        })
      } else {
        const { linkedinConnectDailyCountByBidder } = await getLinkedinConnectCount();
        handleRuntimeMessage({
          message: MESSAGES.UPDATE_BADGE,
          count: linkedinConnectDailyCountByBidder
        })
      }
    }
  }
  return true;
});

// Function to handle URL changes
function onUrlChange() {
  try {
    const syncButton = document.querySelector(`.${BUTTONS.SYNC_CONNECT}`);

    if (PATTERNS.LINKEDIN_PROFILE.test(window.location.href)) {
      if (!syncButton) {
        showButtonInLinkedin(); // Show button if not already shown
      }
    } else if (PATTERNS.LINKEDIN.test(window.location.href)) {
      if (syncButton) {
        removeButtonInLinkedin(MESSAGES.SYNC_CONNECT); // Remove buttons if we navigate away
        removeButtonInLinkedin(MESSAGES.SYNC_PROSPECT);
        if (syncMessages.switch) {
          removeButtonInLinkedin(MESSAGES.SYNC_MESSAGES);
        }
      }
    }
  } catch (err) {
    captureExtensionError(err)
  }
}

window.addEventListener('popstate', onUrlChange);