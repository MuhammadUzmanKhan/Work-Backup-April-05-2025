import { addError } from "@/provider";
import moment from "moment";
import {
  getElementsByText,
  _cleanString,
  stopLoader,
  extractTimezone,
  delay,
  getElementsByTextIncludes,
  errorHandler,
} from "./common";
import ExtensionMenu from "../../view/extensionMenu";
import store from "../../store"; // Import the Vuex store
import { createApp } from "vue";
import { STORAGE } from "@/constants";
import { rollbarThrow } from "@/rollbar";
import { formatMessage } from "..";

const compareUpworkProfiles = async () => {
  const _profile = await chrome.storage.sync.get([STORAGE.UPWORK_PROFILE]);
  let selectedProfile = "";
  if (_profile.upworkProfile) {
    selectedProfile = JSON.parse(_profile.upworkProfile).name;
  }
  const ulElement = document.querySelector(
    ".nav-dropdown-account .nav-dropdown-account-menu"
  );
  const bidProfile = _cleanString(
    getElementsByText(
      "Freelancer",
      "div",
      ulElement
    )[0]?.parentElement?.querySelector("div")?.textContent
  );

  return { bidProfile, selectedProfile };
};
const mountExtensionMenu = async () => {
  const appContainer = document.createElement("div");
  appContainer.id = "extension-menu-container";
  document.body.appendChild(appContainer);
  const extensionMenuApp = createApp(ExtensionMenu);
  extensionMenuApp.use(store).mount("#extension-menu-container");
  await loadProfileInUpwork();
  errorHandler(extensionMenuApp);
}
const loadExtensionInUpwork = async () => {
  let skills = [];
  const maxAttempts = 20;
  let attempts = 0;

  while (skills.length === 0 && attempts < maxAttempts) {
    skills = getElementsByText("Skills and expertise", "h4");
    await delay(500);
    attempts++;
  }
  await mountExtensionMenu()
};
const loadExtensionInOtherUpworkPage = async () => {
  await mountExtensionMenu()
};

const loadProfileInUpwork = async () => {
  let bidProfile = null;
  let ulElement = null;

  await delay(1000);
  ulElement = document.querySelector(
    ".nav-dropdown-account .nav-dropdown-account-menu"
  );

  if (ulElement) {
    bidProfile = _cleanString(
      getElementsByText(
        "Freelancer",
        "div",
        ulElement
      )[0]?.parentElement?.querySelector("div")?.textContent
    );
  }
  if (ulElement && bidProfile) {
    let upworkProfiles = store.state.upworkProfiles.upworkProfiles.profiles;
    let upworkProfile = null;
    if (upworkProfiles) {
      upworkProfile = upworkProfiles.find((prof) => prof.name === bidProfile);
    }
    if (upworkProfile) {
      // Save the profile object in chrome.storage.sync
      await chrome.storage.sync.set({
        upworkProfile: JSON.stringify(upworkProfile),
      });
    }
  }
};

const createModal = (message = 'Contract synced successfully!') => {
  // Create the modal container
  const modal = createElementWithStyles("div", {
    position: "fixed",
    bottom: "40px",
    right: "40px",
    width: "350px",
    backgroundColor: "#ffffff",
    padding: "15px",
    zIndex: "1000",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    fontSize: "14px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    transition: "transform 0.3s ease",
    transform: "translateY(20px)",
  });

  modal.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 10px;">
      <span style="font-size: 22px; color: #52c41a; margin-right: 10px;">✅</span>
      <h4 style="margin: 0; font-size: 14px; color: #333;">${formatMessage(message)}</h4>
    </div>
    <div style="display: flex; justify-content: flex-end;">
      <button id="undo-btn" style="background-color: #ff4d4f; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; transition: background-color 0.3s;">
        Undo
      </button>
    </div>
  `;

  // Add hover effect to keep modal open when hovered
  modal.addEventListener('mouseenter', () => {
    clearTimeout(autoCloseTimeout);
  });

  modal.addEventListener('mouseleave', () => {
    // Re-activate auto-close timeout when mouse leaves the modal
    autoCloseTimeout = setTimeout(() => closeModal(modal, overlay), 5000);
  });

  const overlay = createElementWithStyles("div", {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: "999",
  });

  // Append modal and overlay to body
  document.body.appendChild(modal);
  document.body.appendChild(overlay);

  let autoCloseTimeout = setTimeout(() => closeModal(modal, overlay), 5000);

  document.getElementById("undo-btn").addEventListener("click", () => {
    clearTimeout(autoCloseTimeout);
    modal.innerHTML = `<h4 style="margin: 0; font-size: 14px; color: #ff4d4f;">Sync undone.</h4>`;
    setTimeout(() => closeModal(modal, overlay), 2000);
  });

  return { modal, overlay };
};



// Utility function to create an element with styles
const createElementWithStyles = (tagName, styles) => {
  const element = document.createElement(tagName);
  Object.assign(element.style, styles);
  return element;
};

// Function to close the modal and overlay
const closeModal = (modal, overlay) => {
  modal.style.transform = "translateY(20px)";
  modal.style.opacity = "0";
  overlay.style.opacity = "0";
  setTimeout(() => {
    if (document.body.contains(modal)) {
      document.body.removeChild(modal);
    }
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
  }, 300);
 
  
};

// Add an event listener for capturing the connects information when Submit the proposal button gets clicked
const submitProposalButtonClicked = async () => {
  let footer = null;
  const maxAttempts = 25;
  let attempts = 0;

  try {
    while (!footer && attempts < maxAttempts) {
      footer = document.querySelector(".fe-apply-footer-controls");
      if (footer) {
        break;
      }
      await delay(500);
      attempts++;
    }

    if (footer) {
      const footerBtn = footer.querySelector("button");
      footerBtn.addEventListener("click", async () => {
        const numberPattern = /\d+/;
        let jobConnects = "";
        let proposalConnects = "";

        const priceDetails = document.querySelector(".price-details");
        if (priceDetails) {
          const jobConnectsStr = getElementsByTextIncludes(
            "This proposal requires",
            "div",
            priceDetails
          )[0]?.textContent;
          const matchJobConnects = jobConnectsStr?.match(numberPattern);
          jobConnects = matchJobConnects ? matchJobConnects[0] : "";
        }

        const proposalConnectsStr = footerBtn.textContent;
        const matchProposalConnects = proposalConnectsStr.match(numberPattern);
        proposalConnects = matchProposalConnects
          ? matchProposalConnects[0]
          : jobConnects.length > 0
            ? jobConnects
            : "";

        const idPattern = /job\/~([a-zA-Z0-9]+)/;
        const matchJobId = window.location.href.match(idPattern);
        const jobId = matchJobId ? matchJobId[1] : "";
        const connectsObj = { jobConnects, proposalConnects, jobId };
        const chromeConnectsObj = await chrome.storage.sync.get(
          STORAGE.CONNECT_OBJ_ARRAY
        );
        let connectsObjArr = chromeConnectsObj.connectsObjArr || [];

        // Avoid adding duplicate job IDs
        const existingIndex = connectsObjArr.findIndex(
          (obj) => obj.jobId === connectsObj.jobId
        );
        if (existingIndex === -1) {
          connectsObjArr.push(connectsObj);
        }

        await chrome.storage.sync.set({ connectsObjArr });
      });
    }
  } catch (err) {
    await addError(err);
    rollbarThrow.error(err)
  }
};

const getJobSkills = async () => {
  const skills = getElementsByText("Skills and expertise", "h4");
  const skillsArray = [];
  try {
    if(skills && skills?.length && skills[0]?.parentElement){
      let skillsElements = skills[0].parentElement.querySelectorAll("li");
      if (skillsElements) {
        skillsElements.forEach((ele) =>
          skillsArray.push(_cleanString(ele.textContent))
        );
      }
    }
  } catch (err) {
    await addError(err);
    rollbarThrow.error(err)
  }
  return skillsArray;
};

const _getClientHistory = (el) => {
  const clientHistory = {
    proposals: "",
    interviews: "",
    jobsPosted: "",
    totalSpent: "",
    hoursBilled: "",
    openJobs: "",
    hires: "",
    hired: "",
    hireRate: "",
    avgHourlyRate: "",
    memberJoined: null,
  };

  const proposalsRegex = /proposals/i;
  const interviewsRegex = /interviews/i;
  const jobsPostedRegex = /jobs\s?posted/i;
  const totalSpentRegex = /total\s?spent/i;
  const hoursBilledRegex = /hours\s?(billed)?/i;
  const openJobsRegex = /open\s?jobs?/i;
  const hiresRegex = /hires?/i;
  const hiredRegex = /hired/i;
  const hireRateRegex = /hire\s?rate/i;
  const memberSinceRegex = /member\s?since/i;
  const avgHourlyRateRegex = /avg\s?hourly\s?(rate)?/i;

  if (el) {
    let elements = [];

    // Get all strong and small elements and add them to the elements array
    el.querySelectorAll("strong, small").forEach((element) => {
      elements.push(_cleanString(element.textContent));
    });

    // Get all div elements and filter out certain strings
    el.querySelectorAll("div").forEach((element) => {
      const value = _cleanString(element.textContent);
      if (value && !value.includes("This range includes relevant proposals")) {
        if (value.includes(", ")) {
          const parts = value.split(", ");
          elements.push(...parts.map((part) => part.trim()));
        } else {
          elements.push(value);
        }
      }
    });

    elements.forEach((value) => {
      if (proposalsRegex.test(value)) {
        clientHistory.proposals = value.replace(/ proposals/i, "");
      }
      if (interviewsRegex.test(value)) {
        clientHistory.interviews = value.replace(/ interviews/i, "");
      }
      if (jobsPostedRegex.test(value)) {
        clientHistory.jobsPosted = value.replace(/ jobs\s?posted/i, "");
      }
      if (totalSpentRegex.test(value)) {
        clientHistory.totalSpent = value.replace(/ total\s?spent/i, "");
      }
      if (hoursBilledRegex.test(value)) {
        clientHistory.hoursBilled = value.replace(/ hours\s?(billed)?/i, "");
      }
      if (openJobsRegex.test(value)) {
        clientHistory.openJobs = value.replace(/ open\s?jobs?/i, "");
      }
      if (hiresRegex.test(value)) {
        clientHistory.hires = value.replace(/ hires?/i, "").replace(/ hire/i, "");
      }
      if (hiredRegex.test(value)) {
        clientHistory.hired = value.replace(/ hired/i, "");
      }
      if (hireRateRegex.test(value)) {
        clientHistory.hireRate = value.replace(/ hire\s?rate/i, "");
      }
      if (avgHourlyRateRegex.test(value)) {
        clientHistory.avgHourlyRate = value.replace(/ avg\s?hourly\s?(rate)?\s?(paid)?/i, "");
      }
      if (memberSinceRegex.test(value)) {
        clientHistory.memberJoined = new Date(
          value.replace(/Member\s?since:?/i, "")
        ).toISOString();
      }
    });
  }

  return clientHistory;
};

const _getJobAttributes = (el) => {
  const attributes = {
    experienceLevel: "",
    hourlyRange: "",
    hourly: "",
    projectLengthDuration: "",
    proposeYourTerms: "",
    featuredJob: false,
  };
  const experienceLevelRegex = /experience[-\s]?level/i;
  const hourlyRangeRegex = /hourly[-\s]?range/i;
  const hourlyRegex = /hourly/i;
  const projectLengthDurationRegex = /project[-\s]?length[-\s]?duration/i;
  const fixedPriceRegex = /fixed[-\s]?price/i;

  el &&
    el?.querySelectorAll("ul > li").forEach((element) => {
      if (element.querySelector("small")) {
        let attribute = element.querySelector("small").textContent;
        let headerText = element.querySelector(".header strong").textContent;

        if (experienceLevelRegex.test(attribute)) {
          attributes.experienceLevel = _cleanString(headerText);
        } else if (hourlyRangeRegex.test(attribute)) {
          attributes.hourlyRange = _cleanString(headerText);
        } else if (
          hourlyRegex.test(attribute) &&
          !hourlyRangeRegex.test(attribute)
        ) {
          attributes.hourly = _cleanString(headerText);
        } else if (projectLengthDurationRegex.test(attribute)) {
          attributes.projectLengthDuration = headerText;
        } else if (fixedPriceRegex.test(attribute)) {
          attributes.proposeYourTerms = "Fixed Price";
          attributes.hourlyRange = _cleanString(headerText) + " (Fixed)";
          attributes.hourlyRange = _cleanString(headerText) + " (Fixed)"
        }
      }
    });

  attributes.featuredJob = getElementsByText("Featured Job", "strong").length
    ? true
    : false;
  return attributes;
};

const setBidder = async (bid) => {
  const bidder = await chrome.storage.sync.get([STORAGE.BIDDER]);
  bid.bidder = bidder.bidder;
  return bid;
};

const _getJobSkills = (el) => {
  const skills = [];
  el &&
    el?.querySelectorAll("ul > li").forEach((element) => {
      if (element.querySelector(".air3-token")) {
        const skill = _cleanString(
          element.querySelector(".air3-token").textContent
        );
        skills.push(skill);
      }
    });
  return skills;
};

const _getBidQuestions = (el) => {
  const questions = [];
  if (el) {
    el.querySelectorAll("ul > li").forEach((element) => {
      if (element) {
        questions.push({
          q: element.querySelector("strong").textContent,
          a: element.querySelector("span span").textContent,
        });
      }
    });
  }
  return questions;
};

const addButtonToPage = (text, buttonType, callback) => {
  if (document.querySelector(`.restat-upwork-${buttonType}-button`)) {
    return;
  }
  let button = document.createElement("button");
  button.classList.add(`restat-upwork-${buttonType}-button`);
  button.innerText = text;

  const loadBidSyncButtonSpan = document.createElement("span");
  loadBidSyncButtonSpan.classList.add(...["rs-load", "rs-loading"]);
  button.appendChild(loadBidSyncButtonSpan);
  button.addEventListener("click", () => callback(buttonType));
  document.querySelector("body").append(button);
};

const removeButtonInUpwork = (buttonType) => {
  const button = document.querySelector(`.restat-upwork-${buttonType}-button`);
  const parent = button?.parentNode;
  if (parent) {
    parent.removeChild(button);
  }
};


const expandTextDescriptions = (el) => {
  el?.click?.();
};

const populateBoostedDetails = (bid) => {
  const regex = /\d+/g;
  if (getElementsByText("Boosted proposal", "h2")[0]) {
    bid.boosted = getElementsByText("Boosted proposal", "h2").length
      ? true
      : false;
    const string = getElementsByText(
      "Boosted proposal",
      "h2"
    )[0].parentElement.nextElementSibling.querySelector("p").textContent;
    bid.connects = string.match(regex)[0];
    if (
      getElementsByText(
        "Boosted proposal",
        "h2"
      )[0].parentElement.nextElementSibling.querySelector("p") &&
      !getElementsByText(
        "Boosted proposal",
        "h2"
      )[0].parentElement.nextElementSibling.querySelector("strong")
    ) {
      bid.boosted = false;
      const string = getElementsByText(
        "Boosted proposal",
        "h2"
      )[0].parentElement.nextElementSibling.querySelector("p").textContent;
      bid.connects = string.match(regex)[0];
    }
  }
  return bid;
};

const getJobDetailsFromLocal = (title) => {
  const local = localStorage;
  let jobDataObj;

  for (let job of Object.entries(local)) {
    if (job && Array.isArray(job) && job.length > 0) {
      let jobData = job[1];
      const isValidJob = isJsonString(jobData);
      if (isValidJob) {
        const _jobDataObj = JSON.parse(jobData);
        if (
          _jobDataObj &&
          _jobDataObj.job &&
          htmlToPlainText(_jobDataObj.job.title) === title
        ) {
          jobDataObj = _jobDataObj.job;
          jobDataObj.title = title;
        }
      }
    }
  }
  return jobDataObj;
};

const isJsonString = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

const htmlToPlainText = (html) => {
  const new_el = document.createElement("div");
  new_el.innerHTML = html;
  return new_el.textContent || "";
};

const populateJobDetails = async (bid) => {
  bid.jobDetails.jobTitle = document.querySelector(
    ".fe-job-details .air3-card-section h3"
  )?.textContent ?? 'N/A';
  const jobData = getJobDetailsFromLocal(bid.jobDetails.jobTitle);
  bid.jobDetails.jobCategories = document
    .querySelector(".fe-job-details .air3-card-section")
    ?.querySelector?.(".air3-token")?.textContent ?? '';
  bid.jobDetails.jobDescription = document
    .querySelector(".fe-job-details .air3-card-section")
    .querySelector(".description").innerHTML;
  bid.jobDetails.jobAttributes = _getJobAttributes(
    document
      ?.querySelector(".fe-job-details .air3-card-section")
      ?.querySelector?.(".sidebar")
  );
  bid.jobDetails.jobSkills = getElementsByText("Skills and expertise", "h4")[0] ? _getJobSkills(
    getElementsByText("Skills and expertise", "h4")[0].nextElementSibling
  ) : [];
  
  bid.jobDetails.jobPosted = 
    jobData && jobData.publishedOn
      ? jobData.publishedOn
      : (() => {
          const textContent = document.querySelector(
            ".fe-job-details .air3-card-section ul li small span"
          )?.textContent;
          return textContent 
            ? new Date(_cleanString(textContent)).toISOString() 
            : undefined;
        })();

  bid.jobDetails.inviteOnly = document.querySelector(
    ".fe-job-details .air3-card-section ul li span strong"
  )
    ? true
    : false;
  bid.jobDetails.jobURL = getElementsByText("View job posting", "a")[0].href;
  
  bid.jobObjId = null;
  return bid;
};

const populateProposedTerms = async (bid) => {
  if (
    getElementsByText(
      "Profile",
      "strong",
      document.querySelector(".fe-proposal-job-terms")
    )[0]
  ) {
    bid.proposedTerms.profile = _cleanString(
      document.querySelector(".specialized-profile-info a").textContent
    );
  }
  bid.proposedTerms.rate =
    bid.jobDetails.jobAttributes.proposeYourTerms === "Fixed Price"
      ? _cleanString(
        getElementsByText("Total price of project", "strong")[0]
          .nextElementSibling.nextElementSibling.textContent
      )
      : document.querySelector(".specialized-profile-info")
        ? _cleanString(
          document
            .querySelector(".specialized-profile-info")
            .nextElementSibling.querySelectorAll("div")[2].textContent
        )
        : getElementsByText(
          "You'll receive",
          "strong",
          document.querySelector(".fe-proposal-job-terms")
        )
          ? _cleanString(
            getElementsByText(
              "Hourly Rate",
              "strong",
              document.querySelector(".fe-proposal-job-terms")
            )[0].nextElementSibling.nextElementSibling.textContent
          )
          : "";
  bid.proposedTerms.receivedAmount = _cleanString(
    getElementsByText(
      "You'll receive",
      "strong",
      document.querySelector(".fe-proposal-job-terms")
    )[0].nextElementSibling.nextElementSibling.textContent
  );
  return bid;
};

const populateBidDetails = async (bid) => {
  bid.bidCoverLetter = getElementsByText(
    "Cover letter",
    "h2"
  )[0].parentElement.parentElement.querySelector(".break").innerText;
  bid.bidQuestions = _getBidQuestions(
    document.querySelector("div[data-test='questions-answers']")
  );
  const _profile = await chrome.storage.sync.get([STORAGE.UPWORK_PROFILE]);
  if (_profile.upworkProfile) {
    bid.bidProfile = JSON.parse(_profile.upworkProfile).id;
  }
  bid.invite = getElementsByText("Original message from client", "h2").length
    ? true
    : false;
  bid.bidURL = document.location.href;
  let url = bid.bidURL;
  // Check if the last 2 characters are "#/"
  if (url.endsWith("#/")) {
    // Remove the last 2 characters
    url = url.slice(0, -2);
  }
  bid.bidURL = url;
  bid.bidTime = new Date().toISOString();
  return bid;
};

const populateBidProfileDetails = (bid) => {
  const bidProfileInfo = document.querySelector(
    ".up-fe-proposal-brief-info .mb-6x"
  );
  if (bidProfileInfo) {
    bid.bidProfileInfo.freelancer = _cleanString(
      bidProfileInfo.querySelector("div").querySelector("div a").textContent
    );
    bid.bidProfileInfo.agency = _cleanString(
      bidProfileInfo
        .querySelector("div")
        .querySelector("div")
        .textContent.split(",")[1]
    );
    bid.bidProfileInfo.businessManager = _cleanString(
      bidProfileInfo
        .querySelector("div")
        .querySelector("div")
        .nextElementSibling.textContent.replace("Business Manager:", "")
    );
  }
  return bid;
};

const populateBidClientDetails = (bid) => {
  const iframe = document.querySelector(".up-dash-proposal-room iframe");
  if (iframe) {
    if (
      iframe.contentWindow.document
        ?.querySelector(".top-room-content")
        ?.querySelector(".room-title-wrapper.ellipsis")
    ) {
      const name_company_arr = _cleanString(
        iframe.contentWindow.document
          .querySelector(".top-room-content")
          .querySelector(".room-title-wrapper.ellipsis h4").textContent
      ).split(",");
      bid.client.name = name_company_arr[0];
      bid.client.company =
        name_company_arr.length > 1 ? name_company_arr[1] : "";
    }
    if (
      iframe.contentWindow.document
        .querySelector(".top-room-content")
        .querySelector(".room-subtitle-container.ellipsis")
    ) {
      const time = _cleanString(
        iframe.contentWindow.document
          .querySelector(".top-room-content")
          .querySelector(".room-subtitle-container.ellipsis span").textContent
      );
      const timeZone = extractTimezone(time);
      bid.client.timeZone = timeZone;
    }
  }

  // see if the element actually exists, otherwise it should throw error right away if any of the css class changes in upwork
  if (
    document.querySelector(".air3-card-section").querySelector(".air3-token")
      .parentElement.nextElementSibling
  ) {
    bid.client.upworkPlus =
      _cleanString(
        document
          .querySelector(".air3-card-section")
          ?.querySelector(".air3-token")
          ?.parentElement?.nextElementSibling?.querySelector("span strong")
          ?.textContent
      ) === "Invite Only"
        ? true
        : false;
  }
  const clientInfo = document.querySelector(".fe-client-info");
  if (getElementsByText("Payment method verified", "strong", clientInfo)[0]) {
    bid.client.paymentMethod = _cleanString(
      getElementsByText("Payment method verified", "strong", clientInfo)[0]
        .textContent
    );
  } else if (
    getElementsByText("Payment method not verified", "span", clientInfo)[0]
  ) {
    bid.client.paymentMethod = _cleanString(
      getElementsByText("Payment method not verified", "span", clientInfo)[0]
        .textContent
    );
  }
  bid.client.rating = document.querySelector(".air3-rating")
    ? _cleanString(
      document.querySelector(".air3-rating").nextElementSibling.textContent
    )
    : "";

  const aboutTheClient = getElementsByText("About the client", "h5")[0]
    .parentElement.parentElement;

  bid.client.location.country = aboutTheClient
    .querySelector("ul")
    .querySelector("li[data-qa='client-location'] strong")
    ? _cleanString(
      aboutTheClient
        .querySelector("ul")
        .querySelector("li[data-qa='client-location'] strong").textContent
    )
    : "";
  bid.client.location.state = aboutTheClient
    .querySelector("ul")
    .querySelector("li[data-qa='client-location'] span").textContent
    ? _cleanString(
      aboutTheClient
        .querySelector("ul")
        .querySelector("li[data-qa='client-location'] span").textContent
    )
    : "";
  bid.client.history = _getClientHistory(aboutTheClient.querySelector("ul"));
  return bid;
};

const populateBidResponse = (bid) => {
  bid.bidResponse = getElementsByText("Messages", "h2").length ? true : false;
  if (bid.bidResponse) {
    const iframe = document.querySelector(".up-dash-proposal-room iframe");
    if (
      iframe.contentWindow.document.querySelector(
        ".up-d-story-item.with-header span"
      )?.textContent
    ) {
      const dateLocalTime = new Date(
        `${iframe.contentWindow.document.querySelector(
          ".up-d-story-item.with-header span"
        ).textContent
        }, ${new Date(bid.jobDetails.jobPosted).getFullYear()}`
      )
      const clientTime = _cleanString(
        iframe.contentWindow.document
          .querySelector(".story-timestamp")
          .textContent
      );
      const clientTimeAndTimeZone = clientTime + " " + bid.client.timeZone
      const date = moment(dateLocalTime, 'ddd MMM DD YYYY HH:mm:ss [GMT]ZZ (MMMM Standard Time)');

      const datePart = date.format('ddd MMM DD YYYY');
      const dateTime = datePart + " " + clientTimeAndTimeZone
      const format = 'dddd MMM D YYYY h:mm A';
      const responseDate = moment(dateTime, format);
      if (responseDate.isValid()) {
        bid.response.date = responseDate.toISOString();
      } else {
        bid.response.date = null;
      }
    }
  }
  return bid;
};

let globalTemplates = {};
const populateTemplatesResult = (templates) => {
  document.getElementById("suggestions").innerHTML = "";
  globalTemplates = templates;
  const keys = Object.keys(globalTemplates);
  keys.forEach((key) => {
    _addItem(globalTemplates[key]);
  });
  stopLoader(".form-title");
};

const _addItem = (value) => {
  let suggestions = document.getElementById("suggestions");
  suggestions.innerHTML =
    suggestions.innerHTML + `<li>${value.category} - ${value.type}</li>`;
};

const populateEmptyTemplateResult = () => {
  document.getElementById("suggestions").innerHTML = "";
  const notFound = document.createElement("div");
  notFound.setAttribute("id", "found");
  notFound.innerHTML = "No Data Found";
  document.getElementById("suggestions").appendChild(notFound);
  stopLoader(".form-title");
};

const addCoverLetterTemplate = (template) => {
  template = template.replaceAll("{{project}}\n", "");
  template = template.replaceAll("{{codeSnippet}}\n", "");
  template = template.replaceAll("{{link}}\n", "");

  // document.querySelector(".divFirst").scrollIntoView();
  const textarea = document
    .querySelector(".cover-letter-area")
    ?.querySelector("textarea");
  textarea.value = template;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));

  // Add an event listener to prevent clearing the value on blur
  textarea.addEventListener("blur", () => {
    if (textarea.value === "") {
      textarea.value = template;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  document.querySelector(".cover-letter-area").scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "start",
  });
};

const populateConnectsInformation = async (bid) => {
  const chromeConnectsObj = await chrome.storage.sync.get(STORAGE.CONNECT_OBJ_ARRAY);
  let oldConnectsObjArr = chromeConnectsObj.connectsObjArr || [];
  let connectsObjArr = [];
  for (const connectObj of oldConnectsObjArr) {
    // Convert connectObj.jobId to regex
    const regex_of_jobId = new RegExp(connectObj.jobId, "i"); // 'i' for case-insensitive

    // Test regex against bid.jobDetails.jobURL
    if (regex_of_jobId.test(bid.jobDetails.jobURL)) {
      bid.jobDetails.jobConnects = connectObj.jobConnects;
      bid.connects = connectObj.proposalConnects;
      // Skip adding the matching entry to connectsObjArr
      continue;
    }
    // Add non-matching entries to connectsObjArr
    connectsObjArr.push(connectObj);
  }
  await chrome.storage.sync.set({ connectsObjArr });
  return bid;
};

const handleExtensionErrorInUpwork = (error) => {
  const errorMessage = error.message || "";
  const pattern = /Extension context invalidated/i;
  // Check if the error message contains the pattern
  if (pattern.test(errorMessage)) {
    try {
      removeButtonInUpwork("sync-proposal");
      removeButtonInUpwork("sync-lead");
      removeButtonInUpwork("sync-contract");
      const extensionMenu = document.getElementById("extension-menu-container");
      if (extensionMenu) {
        document.body.removeChild(extensionMenu);
      }
    } catch (_) {
      //
    }
  }
};

export {
  addButtonToPage,
  expandTextDescriptions,
  getElementsByText,
  setBidder,
  populateJobDetails,
  populateBidDetails,
  populateBidProfileDetails,
  populateBidClientDetails,
  populateProposedTerms,
  populateBoostedDetails,
  populateBidResponse,
  populateTemplatesResult,
  populateEmptyTemplateResult,
  addCoverLetterTemplate,
  getJobDetailsFromLocal,
  getJobSkills,
  removeButtonInUpwork,
  submitProposalButtonClicked,
  populateConnectsInformation,
  createModal,
  compareUpworkProfiles,
  loadExtensionInOtherUpworkPage,
  loadProfileInUpwork,
  loadExtensionInUpwork,
  handleExtensionErrorInUpwork,
  closeModal
};
