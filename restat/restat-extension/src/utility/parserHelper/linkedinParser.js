import { linkedinProfileObj } from "@/objects";
import {
  getElementsByText,
  getElementsByTextIncludes,
  _cleanString,
  delay,
  getNextNonEmptyElementSibling,
  getNonEmptyParentElement,
  errorHandler,
  _checkBidder,
  handleRuntimeMessage,
  stopLoader,
  startLoader,
  openNotificationWithIcon,
  openNotification,
} from "./common";
import { createApp } from "vue";
import ExtensionMenuLinkedin from "../../view/extensionMenuLinkedin";
import store from "../../store"; // Import the Vuex store
import { addError, getLocation } from "@/provider";
import { PATTERNS, STORAGE, countryNames } from "@/constants";
import { rollbarThrow } from "@/rollbar";
let profile = { ...linkedinProfileObj };

const removeButtonInLinkedin = (buttonType) => {
  const button = document.querySelector(
    `.restat-linkedin-${buttonType}-button`
  );
  const parent = button?.parentNode;
  if (parent) {
    parent.removeChild(button);
  }
};

const dateRegex = /\d{4}\s- /;
// linkedin page button
const addButton = (text, buttonType, callback) => {
  if (document.querySelector(`.restat-linkedin-${buttonType}-button`)) {
    return;
  }
  let button = document.createElement("button");
  button.classList.add(`restat-linkedin-${buttonType}-button`);
  button.innerText = text;
  const loadConnectSyncButtonSpan = document.createElement("span");
  loadConnectSyncButtonSpan.classList.add(...["rs-load", "rs-loading"]);
  button.appendChild(loadConnectSyncButtonSpan);
  document.querySelector("body").append(button);
  button.addEventListener("click", () => callback(buttonType));
};

const compareLinkedinProfiles = async () => {
  const _profile = await chrome.storage.sync.get([STORAGE.LINKEDIN_PROFILE]);
  let selectedProfile = "";
  if (_profile.linkedinProfile) {
    selectedProfile = JSON.parse(_profile.linkedinProfile).name;
  }
  const bidProfileImg = document.querySelector(".global-nav__me button img");
  let altValue = "";
  if (bidProfileImg) {
    // Get the alt attribute value, you can get the name of the person who is logged in to linkedin by the image alt value
    altValue = bidProfileImg.alt;
  }
  return { altValue, selectedProfile };
};

const loadExtensionInLinkedin = async () => {
  const appContainer = document.createElement("div");
  appContainer.id = "extension-menu-container-linkedin";
  document.body.appendChild(appContainer);
  const extensionMenuLinkedinApp = createApp(ExtensionMenuLinkedin);
  extensionMenuLinkedinApp
    .use(store)
    .mount("#extension-menu-container-linkedin");
  delay(1000);
  await loadProfileInLinkedin()
  errorHandler(extensionMenuLinkedinApp);
};

const loadProfileInLinkedin = async () => {
  let altValue = null;
  await delay(1000);
  const bidProfileImg = document.querySelector(".global-nav__me button img");
  if (bidProfileImg) {
    // Get the alt attribute value, you can get the name of the person who is logged in to linkedin by the image alt value
    altValue = bidProfileImg.alt;
  }
  if (altValue) {
    let linkedinProfiles =
      store.state.linkedinProfiles.linkedinProfiles.profiles;
    let linkedinProfile = null;
    if (linkedinProfiles) {
      linkedinProfile = linkedinProfiles.find((prof) => prof.name === altValue);
    }
    if (linkedinProfile) {
      // Save the profile object in chrome.storage.sync
      await chrome.storage.sync.set({
        linkedinProfile: JSON.stringify(linkedinProfile),
      });
    }
  }
}

const setBusinessDeveloper = async (profile) => {
  const businessDeveloper = await chrome.storage.sync.get([STORAGE.BIDDER]);
  profile.businessDeveloper = businessDeveloper.bidder;
  return profile;
};

const populateIndustry = async (profile) => {
  profile = { ...linkedinProfileObj };
  const industry = await chrome.storage.sync.get([STORAGE.INDUSTRY]);
  if (industry.industry) {
    profile.industry = JSON.parse(industry.industry).id;
  }
  return profile;
};

const populateBidProfile = async (profile) => {
  const _profile = await chrome.storage.sync.get([STORAGE.LINKEDIN_PROFILE]);
  // set the bidProfile
  if (_profile.linkedinProfile) {
    profile.bidProfile = JSON.parse(_profile.linkedinProfile).id;
  }
  return profile;
};
// linkedin page profile information filling functions
const populateProfileDetails = async (profile) => {
  profile.name = _cleanString(
    document
      .querySelector(".artdeco-card")
      .querySelector(".artdeco-hoverable-trigger a h1").textContent
  );
  const profileHeadline = document
    .querySelector(".artdeco-card")
    .querySelector(".text-body-medium").textContent;
  if (profileHeadline) {
    profile.profileHeadline = _cleanString(profileHeadline);
  }

  const location = document
    .querySelector(".artdeco-card")
    .querySelector(
      ".text-body-small.inline.t-black--light.break-words"
    ).textContent;
  if (location) {
    profile.location = _cleanString(location);
    const locationArr = profile.location.split(",").map(_cleanString);
    const [city, state, country] = locationArr;

    if (locationArr.length === 1 && countryNames[city] === city) {
      profile.locationCountry = city;
    } else if (locationArr.length === 2 && countryNames[state] === state) {
      profile.locationState = city;
      profile.locationCountry = state;
    } else if (locationArr.length > 2 && countryNames[country] === country) {
      profile.locationState = state;
      profile.locationCountry = country;
    } else {
      const locationData = await getLocation(profile.location)
      profile.locationState = locationData?.locationState;
      profile.locationCountry = locationData?.locationCountry;
    }
  }

  // getElementsByTextIncludes should not be used as it does not give the exact match but in this particular case the outer span has an inner span which contains the number of connections and then the "connections" string so the textContent of span looked something like that "500+ connections" so I have to call this function which checks if the span includes the string "connections", it does not perform the exact match using equal
  const connections = getElementsByTextIncludes(
    "connections",
    "span",
    document.querySelector(".artdeco-card")
  )[0]?.textContent ?? '';
  profile.connections = _cleanString(connections?.replace?.("connections", "")) ?? '';

  if (
    getElementsByText(
      "Activity",
      "span",
      getNextNonEmptyElementSibling(
        document.querySelector("#content_collections")
      )
    )[0]
  ) {
    const followers = getNextNonEmptyElementSibling(
      getElementsByText(
        "Activity",
        "span",
        getNextNonEmptyElementSibling(
          document.querySelector("#content_collections")
        )
      )[0].parentElement
    ).querySelector("span")?.textContent ?? '';
    profile.followers = _cleanString(followers?.replace?.("followers", "")) ?? '';
  }
  return profile;
};

const populateContactInfoDetails = async (profile) => {
  const contactInfoButton = document.querySelector(
    "#top-card-text-details-contact-info"
  );
  // Reinitialize profile.contactInfo, To ensure the correct behavior it is necessary to create a new object each time. because in our case we are creating a shallow copy and after executing the the line below, we are directly modifying the profile.contactInfo.property in next upcoming lines, if we don't execute the below line first then the nested obj which is contactInfo will be modified in both profile and linkeinProfileObj which will lead to unintended behavior. The line below actually points the reference of object to a newly created object in memory, that's why when we directly modify the value of object, it does not effect the linkedinProfileObj
  profile.contactInfo = {
    linkedinProfileLink: "",
    address: "",
    website: "",
    websites: [],
    phone: "",
    email: "",
    twitter: "",
    birthday: "",
    connected: "",
  };
  if (contactInfoButton) {
    // automatically click the button to open the contact info
    contactInfoButton.click();
    const modalBody = document.querySelector("#artdeco-modal-outlet");
    // Loop through the contact info sections array
    const contactInfoSections = [
      "LinkedinProfileLink",
      "Address",
      "Email",
      "Website",
      "Websites",
      "Phone",
      "Twitter",
      "Birthday",
      "Connected",
    ];
    // isScraped variables is set to true when the information will be scraped
    let isScraped = false;
    let linkedinProfile = null;
    const maxAttempts = 20;
    let attempts = 0;
    // wait until the linkedinProfile information is available, because if that is available, other infos will also be available
    while (!linkedinProfile && attempts < maxAttempts) {
      linkedinProfile = modalBody
        .querySelector(".pv-contact-info__contact-type")
        ?.querySelector("div");
      await delay(500);
      attempts++;
    }
    const linkedInProfile = linkedinProfile.textContent;
    profile.contactInfo.linkedinProfileLink = _cleanString(linkedInProfile);
    if (!linkedInProfile) {
      const url = window.location.href;
      let cleanedUrl = url.replace(/\/overlay\/contact-info\/?$/, '');
      cleanedUrl = cleanedUrl.replace(/\/$/, '');
      cleanedUrl = cleanedUrl.replace(/^(https?:\/\/)?(www\.)?/, '');
      profile.contactInfo.linkedinProfileLink = cleanedUrl;
    }
    // all the information will not be available for all profiles, so when the first info is found that means we can set the scrap variable to true
    isScraped = true;

    for (let i = 1; i < contactInfoSections.length; i++) {
      const contactInfoSectionText = contactInfoSections[i];
      const contactInfoText = contactInfoSectionText.toLocaleLowerCase();
      // Find the contact info section based on its text
      const contactInfoSection = getElementsByText(
        contactInfoSectionText,
        "h3",
        modalBody
      )[0];

      if (contactInfoSection) {
        // Scrape the contact information
        const contactInfo = contactInfoSection.nextElementSibling.textContent;
        // check if contactInfoText is website, some people have multiple websites, so have to check and save the first website
        if (
          contactInfoText === "websites" &&
          contactInfoSection.nextElementSibling.querySelectorAll("li").length >
          1
        ) {
          const liElements =
            contactInfoSection.nextElementSibling.querySelectorAll("li");
          liElements.forEach((liElement) => {
            profile.contactInfo[contactInfoText].push(
              _cleanString(liElement.textContent)
            );
          });
        } else {
          // Perform the scraping logic based on the modal's structure
          profile.contactInfo[contactInfoText] = _cleanString(contactInfo);
        }
      }
    }
    if (
      document.querySelector(".pv-top-card--website")?.querySelector("a") &&
      !profile.contactInfo.website
    ) {
      profile.contactInfo.website = _cleanString(
        document.querySelector(".pv-top-card--website").querySelector("a").href
      );
    }

    // Automatically close the modal, if isScraped is true, that means close the modal after scraping
    const closeButton = document
      .querySelector("#artdeco-modal-outlet")
      .querySelector("button");
    if (isScraped) {
      setTimeout(() => {
        if (closeButton) {
          closeButton.click();
        }
      }, 500);
    }
  }
  if (profile.contactInfo.website !== "") {
    profile.contactInfo.websites.push(profile.contactInfo.website)
  }
  delete profile.contactInfo.website;
  return profile;
};

// this function is made async so that we can call it with await, so it will be asynchronous to wait for the above function, it wait till the contactInfo is fully scrapped
const populateEducationDetails = async (profile) => {
  if (profile.contactInfo.connected !== "") {
    profile.isConnected = true;
  }

  let educationUlElement = null;
  if (document.querySelector("#education")) {
    educationUlElement = getNonEmptyParentElement(
      document.querySelector("#education")
    ).querySelector("ul");
  }
  // empty the profile.education array
  profile.education = [];

  if (educationUlElement) {
    const liElements = Array.from(educationUlElement.children); // Select only immediate children <li> elements within the <ul>
    liElements.forEach((liElement) => {
      let degree = "";
      let duration = "0";
      // Extract information from each <li> element
      const name = _cleanString(
        liElement.querySelector(".hoverable-link-text.t-bold span").textContent
      );
      if (liElement.querySelector(".t-14.t-normal:not(.t-black--light) span")) {
        degree = _cleanString(
          liElement.querySelector(".t-14.t-normal:not(.t-black--light) span")
            .textContent
        );
      }
      if (liElement.querySelector(".t-black--light span")) {
        duration = _cleanString(
          liElement.querySelector(".t-black--light span").textContent
        );
      }

      // Perform any necessary processing of scraping
      if (name || degree || duration) {
        const educationObj = {
          name: name || "",
          degree: degree || "",
          duration: duration || "",
        };
        profile.education.push(educationObj);
      }
    });
  }
  return profile;
};

const populateSkillsDetails = (profile) => {
  let skillsUlElement = null;
  if (document.querySelector("#skills")) {
    skillsUlElement = getNonEmptyParentElement(
      document.querySelector("#skills")
    ).querySelector("ul");
  }
  // empty the profile.skills array
  profile.skills = [];
  if (skillsUlElement) {
    const skillsLiElements = Array.from(skillsUlElement.children); // Select immdediate <li> children elements elements within the <ul>
    skillsLiElements.forEach((liElement) => {
      // Extract information from each <li> element
      const skill = _cleanString(
        liElement.querySelector(".hoverable-link-text.t-bold span").textContent
      );
      if (skill) {
        const skillsObj = {
          name: skill,
        };
        profile.skills.push(skillsObj);
      }
    });
  }
  return profile;
};

const populateExperienceDetails = (profile) => {
  // experience
  let experienceUlElement = null;
  if (document.querySelector("#experience")) {
    experienceUlElement = getNonEmptyParentElement(
      document.querySelector("#experience")
    ).querySelector("ul");
  }
  // empty the profile.experience array
  profile.experience = [];

  if (experienceUlElement) {
    const liElements = Array.from(experienceUlElement.children);
    // date regex
    let index = 0;
    liElements.forEach((liElement) => {
      // this if checks if we have to save another type of object that is {company: '', duration: '', location: '', title: [{ title: '', location: '', duration: ''}]}
      if (
        liElement.querySelector(
          ".display-flex.align-items-center.mr1.t-bold.hoverable-link-text"
        )
      ) {
        const company = _cleanString(
          liElement.querySelector(
            ".display-flex.align-items-center.mr1.t-bold.hoverable-link-text span"
          ).textContent
        );
        let duration = liElement.querySelector(
          ".t-14.t-normal:not(.t-black--light) span"
        ).textContent;
        if (duration) {
          if (duration.includes(" · ")) {
            duration = _cleanString(duration.split(" · ")[1]);
          } else {
            duration = _cleanString(duration);
          }
        }
        let location = liElement
          .querySelector(".t-14.t-normal:not(.t-black--light)")
          .nextElementSibling?.querySelector(
            ".t-black--light span"
          ).textContent;
        if (location) {
          if (location.includes(" · ")) {
            location = _cleanString(location.split(" · ")[0]);
          } else {
            location = _cleanString(location);
          }
        }
        if (company || duration || location) {
          let experienceObj = {
            company: company || "",
            duration: duration || "",
            location: location || "",
            title: [],
          };
          profile.experience.push(experienceObj);
        }
        const childLiElements = Array.from(
          liElement.querySelector("ul").children
        );

        if (childLiElements.length > 0) {
          // loop within a loop, for filling the title array in the object
          childLiElements.forEach((childLiElement) => {
            const career_break = getElementsByText("Career Break", "span", childLiElement)[0]
            if (career_break) {
              return;
            }
            const title = _cleanString(
              childLiElement.querySelector(
                ".mr1.t-bold span, .mr1.hoverable-link-text.t-bold span"
              ).textContent
            );
            const duration_or_location = childLiElement.querySelector(
              ".t-14.t-normal.t-black--light span"
            ).textContent;
            let location = "";
            let duration = "";
            const matches = duration_or_location.match(dateRegex);
            const isMatch = matches !== null;
            if (isMatch) {
              duration = duration_or_location;
            } else {
              location = duration_or_location;
            }
            location = childLiElement
              .querySelector(".t-14.t-normal.t-black--light")
              .nextElementSibling?.querySelector(
                ".t-black--light span"
              ).textContent;
            if (location) {
              if (location.includes(" · ")) {
                location = _cleanString(location.split(" · ")[0]);
              } else {
                location = _cleanString(location);
              }
            }
            if (title || duration || location) {
              const experienceObj = {
                title: title || "",
                duration: duration || "",
                location: location || "",
              };
              profile.experience[index].title.push(experienceObj);
            }
          });
        }
      }
      // we have to save two kinds of object in the profile.experience array, so first if checks if we have to save the object matching first type that is {comapny: '', title: '', duration: '', location: ''}
      else if (
        liElement.querySelector(
          ".display-flex.align-items-center.mr1.t-bold:not(.hoverable-link-text)"
        )
      ) {
        const career_break = getElementsByText("Career Break", "span", liElement)[0]
        if (career_break) {
          return;
        }
        let title = "";
        if (
          liElement.querySelector(
            ".display-flex.align-items-center.mr1.t-bold span"
          )
        ) {
          title = _cleanString(
            liElement.querySelector(
              ".display-flex.align-items-center.mr1.t-bold span"
            ).textContent
          );
        }
        let company = "";
        if (
          liElement.querySelector(".t-14.t-normal:not(.t-black--light) span")
        ) {
          company = liElement.querySelector(
            ".t-14.t-normal:not(.t-black--light) span"
          ).textContent;
          if (company) {
            if (company.includes(" · ")) {
              company = _cleanString(company.split(" · ")[0]);
            } else {
              company = _cleanString(company);
            }
          }
        }

        let location = "";
        let duration = "";
        if (liElement.querySelector(".t-black--light span")) {
          // duration and location have the exact same classes, so they can't be selected based on a unique class, as we are not sure that both of them will always be present, we have to first scrap the fisrt information and compare it with dateRegex, if match is found then the info is date otherwise it is location
          const duration_or_location = _cleanString(
            liElement.querySelector(".t-black--light span").textContent
          );

          const matches = duration_or_location.match(dateRegex);
          const isMatch = matches !== null;
          if (isMatch) {
            duration = duration_or_location;
          } else {
            location = duration_or_location;
          }
        }
        // check if location is also present, after scraping the duration
        if (
          liElement
            .querySelector(".t-black--light")
            ?.nextElementSibling?.querySelector(".t-black--light span")
        ) {
          location = liElement
            .querySelector(".t-black--light")
            .nextElementSibling?.querySelector(
              ".t-black--light span"
            ).textContent;
          if (location) {
            if (location.includes(" · ")) {
              location = _cleanString(location.split(" · ")[0]);
            } else {
              location = _cleanString(location);
            }
          }
        }

        if (title || company || duration || location) {
          const experienceObj = {
            title: title || "",
            company: company || "",
            duration: duration || "",
            location: location || "",
          };
          profile.experience.push(experienceObj);
        }
      }
      index = index + 1;
    });
  }
  return profile;
};

const handleExtensionErrorInLinkedin = (error) => {
  const errorMessage = error.message || "";
  const pattern = /Extension context invalidated/i;
  // Check if the error message contains the pattern
  if (pattern.test(errorMessage)) {
    removeButtonInLinkedin("sync-connect");
      removeButtonInLinkedin("sync-prospect");
      const extensionMenu = document.getElementById(
        "extension-menu-container-linkedin"
      );
      if (extensionMenu) {
        document.body.removeChild(extensionMenu);
      }
  }
};

async function syncProfileDetails(requestType) {
  profile = await setBusinessDeveloper(profile);
  profile = await populateProfileDetails(profile);
  profile = await populateContactInfoDetails(profile);
  profile = await populateEducationDetails(profile);
  profile = populateSkillsDetails(profile);
  profile = populateExperienceDetails(profile);
  const rawHtml = document.querySelector("main").outerHTML;
  const contactInfoPopupRawHtml = document.getElementById("artdeco-modal-outlet").outerHTML
  profile.rawHtml = rawHtml
  profile.contactInfoPopupRawHtml = contactInfoPopupRawHtml
  await handleRuntimeMessage({ message: requestType, object: profile })
}

async function handleSyncProfile(requestType = "sync-connect") {
  stopLoader(`.restat-linkedin-${requestType}-button`);
  try {
    if (await _checkBidder()) {
      openNotificationWithIcon("info", "Please log in to continue!")
      return;
    }

    let industry = await chrome.storage.sync.get(STORAGE.INDUSTRY);
    if (!industry.industry) {
      openNotificationWithIcon('warning', "Please select an industry!")
      return;
    }
    if (!PATTERNS.LINKEDIN_PROFILE.test(window.location.href)) {
      openNotificationWithIcon("warning", "You are not on a linkedin profile page!")
      return;
    }
    startLoader(`.restat-linkedin-${requestType}-button`);

    profile = await populateIndustry(profile);

    const { altValue, selectedProfile } = await compareLinkedinProfiles();
    if (altValue !== selectedProfile) {
      if (selectedProfile === "") {
        openNotificationWithIcon("warning", "Please select a profile.")
      } else {
        openNotificationWithIcon("info", `You are logged in with ${altValue}'s profile but selected ${selectedProfile}'s profile!`)
      }
    } else {
      profile = await populateBidProfile(profile);
      // if the linked in Profile does not have a follow, Following, connect or pending button that means you are connected with that person
      const actions = document
        .querySelector(".ph5.pb5")
        ?.querySelector(".app-aware-link.inline-flex")?.nextElementSibling;
      const pendingButtonArr = getElementsByText("Pending", "span", actions);
      const removeConnectionArr = getElementsByText(
        "Remove Connection",
        "span",
        actions
      );

      if (requestType === "sync-prospect") {
        if (pendingButtonArr.length === 0 && removeConnectionArr.length === 0) {
          return openNotificationWithIcon("warning", "Please send connection request first!");
        }
        if (pendingButtonArr.length !== 0 && removeConnectionArr.length === 0) {
          return openNotificationWithIcon("warning", "You are not connected. Please click the 'Sync Connection' button to proceed.");
        }
        await syncProfileDetails(requestType)
      } else {
        if (pendingButtonArr.length === 0 && removeConnectionArr.length === 0) {
          return openNotificationWithIcon("warning", "Please send connection request first!");
        }
        if (removeConnectionArr.length !== 0) {
          return openNotificationWithIcon("info",
            "You are connected. Please click the 'Sync Prospect' button to proceed."
          );
        }
        await syncProfileDetails(requestType)
      }
    }
  } catch (err) {
    openNotification("error", "There was a temporary issue syncing your action. Please try again in a few minutes.")
    await addError(err);
    handleExtensionErrorInLinkedin(err);
    rollbarThrow.error(err)
  } finally {
    stopLoader(`.restat-linkedin-${requestType}-button`);
  }
}

export {
  addButton,
  setBusinessDeveloper,
  populateProfileDetails,
  populateContactInfoDetails,
  populateEducationDetails,
  populateSkillsDetails,
  populateExperienceDetails,
  populateIndustry,
  populateBidProfile,
  compareLinkedinProfiles,
  loadExtensionInLinkedin,
  handleExtensionErrorInLinkedin,
  removeButtonInLinkedin,
  loadProfileInLinkedin,
  handleSyncProfile,
};
