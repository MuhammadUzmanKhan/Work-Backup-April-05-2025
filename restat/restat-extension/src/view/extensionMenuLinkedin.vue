<template>
  <div>

    <div class="rs-logo-container-linkedin" @click="showExtensionBarClick">
      <div class="rs-bar-linkedin"></div>
      <div class="rs-logo-linkedin">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 36 35.974" id="rsLogo">
          <path
            d="M219.3,808.321c-7.951-7.364-15.695-14.982-24.195-22.854,7.245.117,13.114-.815,18.881,2.779C221.9,793.174,223.2,803.358,219.3,808.321Z"
            transform="translate(-188.659 -785.44)" fill="#ee3a23" />
          <path
            d="M200.007,823.423h-9.933a5.438,5.438,0,0,1-3.737-1.762c-7.579-7.352-17.009-17.266-21.232-21.489a3.6,3.6,0,0,1-1.079-2.889c.017-4.441-.005-5.639-.005-9.8,12.326,12.1,24.156,24.33,35.986,35.941Z"
            transform="translate(-164.007 -787.471)" fill="#1a4895" />
          <path d="M164.239,837l16.179,16.3H164.239Z" transform="translate(-164.239 -817.325)" fill="#faca2a" />
        </svg>
      </div>
    </div>
    
    <div class="rs-extension-main-linkedin" @click="moveToFront">
      <div class="rs-extension-bar-linkedin">
        <div>
          <a class="rslogo-linkedin">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 36 35.974" id="rsLogo">
              <path
                d="M219.3,808.321c-7.951-7.364-15.695-14.982-24.195-22.854,7.245.117,13.114-.815,18.881,2.779C221.9,793.174,223.2,803.358,219.3,808.321Z"
                transform="translate(-188.659 -785.44)" fill="#ee3a23" />
              <path
                d="M200.007,823.423h-9.933a5.438,5.438,0,0,1-3.737-1.762c-7.579-7.352-17.009-17.266-21.232-21.489a3.6,3.6,0,0,1-1.079-2.889c.017-4.441-.005-5.639-.005-9.8,12.326,12.1,24.156,24.33,35.986,35.941Z"
                transform="translate(-164.007 -787.471)" fill="#1a4895" />
              <path d="M164.239,837l16.179,16.3H164.239Z" transform="translate(-164.239 -817.325)" fill="#faca2a" />
            </svg>
          </a>
          <!-- <div class="rs-ext-menu mt-4 rs-ext-menu-disabled"> -->
          <!-- <a-tooltip title="Templates">
              <div>
                <div class="rs-li-icon-container-linkedin" id="templateIcon">
                  <CopyOutlined style="font-size: 20px; color: white;" />
                </div>
              </div>
            </a-tooltip>
            <a-tooltip title="Projects">
              <div>
                <div class="rs-li-icon-container-linkedin" id="projectsIcon">
                  <FileOutlined style="font-size: 20px; color: white;" />
                </div>
              </div>
            </a-tooltip>
            <a-tooltip title="Case Studies">
              <div>
                <div class="rs-li-icon-container-linkedin" id="caseStudyIcon">
                  <FileTextOutlined style="font-size: 20px; color: white;" />
                </div>
              </div>
            </a-tooltip>
            <a-tooltip title="Links">
              <div>
                <div class="rs-li-icon-container-linkedin" id="linksIcon">
                  <LinkOutlined style="font-size: 24px; color: white;" />
                </div>
              </div>
            </a-tooltip> -->
          <!-- </div> -->
        </div>
        <div class="rs-ext-menu rs-ext-bottom">
          <!-- <a-tooltip v-if="bidder === ''" title="Sign in">
            <div>
              <div class="mt-4 rs-li-icon-container-linkedin" id="rs-user-icon" @click="displaySigninScreen">
                <UserOutlined class="rs-user-icon-linkedin" style="font-size: 24px; color: #ffffff;" />
                <div class="rs-login-badge">Log in</div>
              </div>
            </div>
          </a-tooltip>
          <a-tooltip v-else title="User Screen">
            <div>
              <div class="mt-4 rs-li-icon-container-linkedin" id="rs-user-icon" @click="displayLogoutScreen">
                <div class="rs-user-name-linkedin">{{ initials }}</div>
              </div>
            </div>
          </a-tooltip> -->
          <div>
            <a-tooltip v-if="bidder === ''" title="AI">
              <div>
                <div class="mt-2 rs-li-icon-container-ai" @click="displaySigninScreen">
                  <RobotOutlined style="font-size: 22px; color: #ffffff;" />
                </div>
              </div>
            </a-tooltip>
            <a-tooltip v-else title="AI">
              <div>
                <div class="mt-2 rs-li-icon-container-ai" @click="displayLogoutScreen">
                  <RobotOutlined style="font-size: 22px; color: #ffffff;" />
                </div>
              </div>
            </a-tooltip>
          </div>
          <a-tooltip v-if="bidder === ''" title="Sign in">
            <div>
              <div class="mt-2 rs-li-icon-container-linkedin" id="rs-user-icon" @click="displaySigninScreen">
                <UserOutlined class="rs-user-icon-linkedin" style="font-size: 24px; color: #ffffff;" />
                <div class="rs-login-badge">Log in</div>
              </div>
            </div>
          </a-tooltip>
          <a-tooltip v-else title="User Screen">
            <div>
              <div class="mt-2 rs-li-icon-container-linkedin" id="rs-user-icon" @click="displayLogoutScreen">
                <div class="rs-user-name-linkedin">{{ initials }}</div>
              </div>
            </div>
          </a-tooltip>
        </div>
      </div>
      <div class="rs-extension-detail-block-linkedin" id="rs-extension-detail-block-linkedin">
        <div v-if="!showLogoutScreen">
          <SignIn :linkedinPage="linkedinPage" :rightPortionOpen="rightPortionOpen" :addButton="addButton"
            @directToTheLogoutScreen="directToLogoutScreen" @signedIn="signedIn" />
        </div>
        <div v-else-if="showLogoutScreen && bidder !== ''">
          <Logout :linkedinPage="linkedinPage" :initials="initials" :bidder="bidder" :addButton="addButton"
            @clearTheBidder="clearBidder" :linkedinConnectDailyCountByBidder="linkedinConnectDailyCountByBidder
      " :linkedinConnectMonthlyCountByBidder="linkedinConnectMonthlyCountByBidder
      " :linkedinProspectDailyCountByBidder="linkedinProspectDailyCountByBidder"
            :linkedinProspectMonthlyCountByBidder="linkedinProspectMonthlyCountByBidder"
            :linkedinTargetDaily="linkedinTargetDaily" :linkedinTargetMonthly="linkedinTargetMonthly"
            :showAiComponent="showAiComponent" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SignIn from "@/components/SignIn.vue";
import Logout from "@/components/Logout.vue";
import { linkedinPagesWrapMethods } from "@/utility/linkedinPagesWrapMethods.js";
import { Tooltip } from 'ant-design-vue';
import { clickOutsideExtension, getLinkedinConnectCount, setInitials, setUp } from "@/utility"
import { PATTERNS } from "@/constants";
import { UserOutlined, RobotOutlined } from '@ant-design/icons-vue';

export default {
  data() {
    return {
      linkedinConnectDailyCountByBidder: 0,
      linkedinConnectMonthlyCountByBidder: 0,
      linkedinProspectDailyCountByBidder: 0,
      linkedinProspectMonthlyCountByBidder: 0,
      linkedinTargetMonthly: null,
      linkedinTargetDaily: null,
      rightPortionOpen: false,
      activeTab: null,
      initials: "",
      open: false,
      showLogoutScreen: false,
      bidder: "",
      layoutContainer: null,
      showBidPreview: false,
      addButton: false,
      openBidPreview: false,
      suggestedTags: null,
      linkedinPage: true,
      showAiComponent: false
    };
  },
  name: "ExtensionMenuLinkedin",
  components: { SignIn, Logout, 'a-tooltip': Tooltip, UserOutlined, RobotOutlined },

  // linkedinWrapMethods is a HOF which will ensure that "Extension context invalidated" error is handled properly
  methods: linkedinPagesWrapMethods({
    handleCloseExtension() {
      const extensionDetailBlock = document.querySelector(
        ".rs-extension-detail-block-linkedin"
      );
      if (extensionDetailBlock.style.display !== "none") {
        extensionDetailBlock.style.display = "none";
      }
    },

    showExtensionBarClick() {
      // I have to add setTimeout here because of a very unexpected bug, style.left was set to 0 but then right after that it was set to -7rem again, solved this issue using setTimeout
      setTimeout(() => {
        const extensionMainLinkedin = document.querySelector(
          ".rs-extension-main-linkedin"
        );
        extensionMainLinkedin.style.left = "0rem"
      }, 0);
      const rsLogo = document.querySelector(".rs-logo-container-linkedin")
      rsLogo.style.display = "none";
    },

    showExtensionBar() {
      const extensionMain = document.querySelector(
        ".rs-extension-main-linkedin"
      );
      extensionMain.style.left = "0rem";
    },

    hideExtensionBar() {
      const extensionMain = document.querySelector(
        ".rs-extension-main-linkedin"
      );
      const extensionDetailBlock = document.querySelector(
        ".rs-extension-detail-block-linkedin"
      );
      if (
        extensionDetailBlock.style.display === "none" ||
        extensionDetailBlock.style.display === ""
      ) {
        extensionMain.style.left = "-7rem";
      }
    },

    clearBidder() {
      this.bidder = "";
      this.showLogoutScreen = false;
    },

    displaySigninScreen() {
      const extensionDetailBlock = document.querySelector(
        ".rs-extension-detail-block-linkedin"
      );
      if (!this.open) {
        if (
          extensionDetailBlock.style.display === "none" ||
          extensionDetailBlock.style.display === ""
        ) {
          extensionDetailBlock.style.display = "flex";
        }
        this.open = true;
      } else {
        this.handleCloseExtension();
        this.open = false;
      }
    },

    async displayLogoutScreen(event) {
      if (this.showAiComponent) {
        this.showAiComponent = false;
      }
      const extensionDetailBlock = document.querySelector(
        ".rs-extension-detail-block-linkedin"
      );
      // Remove rs-active-tab class from all tabs
      document
        .querySelectorAll(".rs-li-icon-container-linkedin")
        .forEach((tab) => {
          tab.classList.remove("rs-active-tab");
        });
      // remove the active tab for ai component if it is active
      document
        .querySelector(".rs-li-icon-container-ai")
        ?.classList.remove("rs-active-tab");
      const prevActiveTabVal = this.activeTab;
      this.activeTab = event.currentTarget;
      this.activeTab.classList.add("rs-active-tab");
      if (!this.open) {
        if (
          extensionDetailBlock.style.display === "none" ||
          extensionDetailBlock.style.display === ""
        ) {
          extensionDetailBlock.style.display = "flex";
          extensionDetailBlock.style.borderRadius = "0 1rem 1rem 0";
        }
        this.open = true;
        ({ linkedinConnectDailyCountByBidder: this.linkedinConnectDailyCountByBidder, linkedinConnectMonthlyCountByBidder: this.linkedinConnectMonthlyCountByBidder, linkedinProspectMonthlyCountByBidder: this.linkedinProspectMonthlyCountByBidder, linkedinProspectDailyCountByBidder: this.linkedinProspectDailyCountByBidder, linkedinTargetMonthly: this.linkedinTargetMonthly, linkedinTargetDaily: this.linkedinTargetDaily } = await getLinkedinConnectCount());
      } else {
        if (this.activeTab === prevActiveTabVal) {
          this.handleCloseExtension();
          this.open = false;
        }
      }
      this.showLogoutScreen = true;
      if (this.activeTab.classList.contains("rs-li-icon-container-ai")) {
        this.showAiComponent = true;
      }
    },

    directToLogoutScreen() {
      this.showLogoutScreen = true;
    },

    async signedIn() {
      ({ linkedinConnectDailyCountByBidder: this.linkedinConnectDailyCountByBidder, linkedinConnectMonthlyCountByBidder: this.linkedinConnectMonthlyCountByBidder, linkedinProspectMonthlyCountByBidder: this.linkedinProspectMonthlyCountByBidder, linkedinProspectDailyCountByBidder: this.linkedinProspectDailyCountByBidder, linkedinTargetMonthly: this.linkedinTargetMonthly, linkedinTargetDaily: this.linkedinTargetDaily } = await getLinkedinConnectCount());
    },

    handleLayoutContainerClick() {
      const extensionDetailBlock = document.querySelector(
        ".rs-extension-detail-block-linkedin"
      );
      const extensionMain = document.querySelector(
        ".rs-extension-main-linkedin"
      );
      if (extensionDetailBlock.style.display !== "none") {
        extensionDetailBlock.style.display = "none";
      }
      if (extensionMain?.style?.left === "0rem") {
        extensionMain.style.left = "-7rem";
      }
      this.open = false;
    },

    async handleDocumentClick(event) {
      const extensionMain = document.querySelector(".rs-extension-main-linkedin");
      const rsLogo = document.querySelector(".rs-logo-container-linkedin")
      let bidder = await chrome.storage.sync.get(['bidder']);
      clickOutsideExtension(extensionMain, rsLogo, event, this.handleLayoutContainerClick, bidder?.bidder)
    },

    async handleStorageChange(changes, namespace) {
      if (namespace === "sync" && changes.bidder) {
        const newBidderObj = changes.bidder || { bidder: "" };
        await this.updateBidder(newBidderObj);
      }
    },

    async updateBidder(bidderObj) {
      this.bidder = bidderObj.newValue;
      this.initials = bidderObj.newValue
        ? bidderObj.newValue.charAt(0).toUpperCase()
        : "";
      if (this.bidder !== "") {
        await this.$store.dispatch("industries/fetchIndustries");
        await this.$store.dispatch("linkedinProfiles/fetchLinkedinProfiles");
        await this.$store.dispatch("upworkProfiles/fetchUpworkProfiles");
        await this.$store.dispatch("countBids/fetchBids");
        await this.$store.dispatch("countLinkedinConnects/fetchLinkedinConnects");

        ({ linkedinConnectDailyCountByBidder: this.linkedinConnectDailyCountByBidder, linkedinConnectMonthlyCountByBidder: this.linkedinConnectMonthlyCountByBidder, linkedinProspectMonthlyCountByBidder: this.linkedinProspectMonthlyCountByBidder, linkedinProspectDailyCountByBidder: this.linkedinProspectDailyCountByBidder, linkedinTargetMonthly: this.linkedinTargetMonthly, linkedinTargetDaily: this.linkedinTargetDaily } = await getLinkedinConnectCount());
        if (PATTERNS.SUBMIT_PROPOSAL.test(window.location.href)) {
          this.showLogoutScreen = false;
        } else {
          this.showLogoutScreen = true;
        }
      } else {
        this.showLogoutScreen = false;
      }
    },
  }),

  async mounted() {
    if (PATTERNS.LINKEDIN.test(window.location.href)) {
      this.addButton = true;
      await this.$store.dispatch("industries/fetchIndustries");
    }
    ({ bidder: this.bidder, initials: this.initials } = await setInitials());
    chrome.storage.onChanged.addListener(this.handleStorageChange);
    if (this.bidder !== "") {
      // get all industries and linkedin profiles
      await this.$store.dispatch("industries/fetchIndustries");
      await this.$store.dispatch("linkedinProfiles/fetchLinkedinProfiles");
      await this.$store.dispatch("upworkProfiles/fetchUpworkProfiles");
      await this.$store.dispatch("countBids/fetchBids");
      await this.$store.dispatch("countLinkedinConnects/fetchLinkedinConnects");
    }
    document.addEventListener("click", this.handleDocumentClick);
    ({ linkedinConnectDailyCountByBidder: this.linkedinConnectDailyCountByBidder, linkedinConnectMonthlyCountByBidder: this.linkedinConnectMonthlyCountByBidder, linkedinProspectMonthlyCountByBidder: this.linkedinProspectMonthlyCountByBidder, linkedinProspectDailyCountByBidder: this.linkedinProspectDailyCountByBidder, linkedinTargetMonthly: this.linkedinTargetMonthly, linkedinTargetDaily: this.linkedinTargetDaily } = await setUp());
  },

  beforeUnmount() {
    // Remove document click listener
    document.removeEventListener("click", this.handleDocumentClick);
    chrome.storage.onChanged.removeListener(this.handleStorageChange);
  },
};
</script>

<style scoped>
.rs-ext-menu-disabled {
  /* pointer-events: none !important; */
  opacity: 0.5;
  cursor: not-allowed !important;
}

.rs-ext-menu-disabled .rs-li-icon-container-linkedin {
  cursor: not-allowed !important;
}

#extension-menu-container-linkedin ::-webkit-scrollbar {
  width: 5px;
}

#extension-menu-container-linkedin ::-webkit-scrollbar-track:horizontal {
  background: transparent;
  border-radius: 2px;
}

#extension-menu-container-linkedin ::-webkit-scrollbar-thumb:horizontal {
  background: #75959e;
  border-radius: 2px;
}

#extension-menu-container-linkedin ::-webkit-scrollbar-thumb:horizontal:hover {
  background: #29454d;
}

#extension-menu-container-linkedin ::-webkit-scrollbar-track:vertical {
  background: transparent;
  border-radius: 2px;
}

#extension-menu-container-linkedin ::-webkit-scrollbar-track:horizontal {
  background: transparent;
  border-radius: 2px;
}

#extension-menu-container-linkedin ::-webkit-scrollbar-thumb:vertical {
  background: #75959e;
  border-radius: 2px;
}

#extension-menu-container-linkedin ::-webkit-scrollbar-thumb:vertical:hover {
  background: #29454d;
}

*,
#extension-menu-container-linkedin ::after,
#extension-menu-container-linkedin ::before {
  box-sizing: border-box;
}

.rsLogoStyle {
  position: fixed;
  bottom: 50%;
  left: 0rem;
  z-index: 5;
}

.rsLogoStyle:hover {
  left: 2rem;
}

@import "../assets/styles/extensionMenuLinkedin.css";
</style>
