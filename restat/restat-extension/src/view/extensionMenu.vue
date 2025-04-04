<template>
  <div>

    <div class="rs-logo-container" @click="showExtensionBar">
      <div class="rs-bar"></div>
      <div class="rs-logo">
        <svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 0 36 35.974">
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

    <div class="rs-extension-main">
      <div class="rs-extension-bar">
        <div>
          <a class="rslogo">
            <svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 0 36 35.974">
              <path
                d="M219.3,808.321c-7.951-7.364-15.695-14.982-24.195-22.854,7.245.117,13.114-.815,18.881,2.779C221.9,793.174,223.2,803.358,219.3,808.321Z"
                transform="translate(-188.659 -785.44)" fill="#ee3a23" />
              <path
                d="M200.007,823.423h-9.933a5.438,5.438,0,0,1-3.737-1.762c-7.579-7.352-17.009-17.266-21.232-21.489a3.6,3.6,0,0,1-1.079-2.889c.017-4.441-.005-5.639-.005-9.8,12.326,12.1,24.156,24.33,35.986,35.941Z"
                transform="translate(-164.007 -787.471)" fill="#1a4895" />
              <path d="M164.239,837l16.179,16.3H164.239Z" transform="translate(-164.239 -817.325)" fill="#faca2a" />
            </svg>
          </a>
          <div class="rs-ext-menu mt-4" :class="{ 'rs-ext-menu-disabled': addButton || otherPage }">
            <a-tooltip title="Templates">
              <div>
                <div class="rs-li-icon-container" id="rs-templateIcon" @click="iconClicked">
                  <CopyOutlined style="font-size: 20px; color: white;" />
                </div>
              </div>
            </a-tooltip>
            <a-tooltip title="Projects">
              <div>
                <div class="rs-li-icon-container" id="rs-projectsIcon" @click="iconClicked">
                  <FileOutlined style="font-size: 20px; color: white;" />
                </div>
              </div>
            </a-tooltip>
            <a-tooltip title="Case Studies">
              <div>
                <div class="rs-li-icon-container" id="rs-caseStudyIcon" @click="iconClicked">
                  <FileTextOutlined style="font-size: 20px; color: white;" />
                </div>
              </div>
            </a-tooltip>
            <a-tooltip title="Links">
              <div>
                <div class="rs-li-icon-container" id="rs-linksIcon" @click="iconClicked">
                  <LinkOutlined style="font-size: 24px; color: white;" />
                </div>
              </div>
            </a-tooltip>
            <a-tooltip title="Bid Preview">
              <div>
                <div class="rs-li-icon-container" id="rs-previewIcon" @click="iconClicked">
                  <EyeOutlined style="font-size: 24px; color: white;" />
                </div>
              </div>
            </a-tooltip>
          </div>
        </div>
        <div class="rs-ext-menu rs-ext-bottom">
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
              <div class="mt-2 rs-li-icon-container" id="rs-user-icon" @click="displaySigninScreen">
                <UserOutlined class="rs-user-icon" style="font-size: 24px; color: #ffffff;" />
                <div class="rs-login-badge">Log in</div>
              </div>
            </div>
          </a-tooltip>
          <a-tooltip v-else title="User Screen">
            <div>
              <div class="mt-2 rs-li-icon-container" id="rs-user-icon" @click="displayLogoutScreen">
                <div class="rs-user-name">{{ initials }}</div>
              </div>
            </div>
          </a-tooltip>
        </div>
      </div>
      <div class="rs-extension-detail-block" id="rs-extension-detail-block">
        <div v-if="!showLogoutScreen">
          <SignIn :bidder="bidder" :initials="initials" :rightPortionOpen="rightPortionOpen" :addButton="addButton"
            @directToTheLogoutScreen="directToLogoutScreen" @signedIn="signedIn" />
        </div>
        <div v-else-if="showLogoutScreen">
          <Logout :initials="initials" :bidder="bidder" :bidDailyCountByBidder="bidDailyCountByBidder"
            :bidMonthlyCountByBidder="bidMonthlyCountByBidder" :leadDailyCountByBidder="leadDailyCountByBidder"
            :leadMonthlyCountByBidder="leadMonthlyCountByBidder" :upworkTargetMonthly="upworkTargetMonthly"
            :upworkTargetDaily="upworkTargetDaily" :addButton="addButton" :showAiComponent="showAiComponent"
            :autoClose="autoClose" :autoCloseFeature="autoCloseFeature" @clearTheBidder="clearBidder" />
        </div>
      </div>
      <div class="rs-extension-detail-block2" id="rs-extension-detail-block2">
        <div v-if="currentView === 'rs-templateIcon'">
          <Templates @goToNext="goToNext" />
        </div>
        <div v-if="currentView === 'rs-projectsIcon'">
          <Projects @goToNext="goToNext" @goToBack="goToBack" />
        </div>
        <div v-if="currentView === 'rs-caseStudyIcon'">
          <CaseStudies @goToNext="goToNext" @goToBack="goToBack" />
        </div>
        <div v-if="currentView === 'rs-linksIcon'">
          <Links @goToBack="goToBack" @goToNext="goToNext" />
        </div>
        <div v-if="currentView === 'rs-previewIcon'">
          <BidPreview @goToBack="goToBack" @closeExtensionWhenDone="closeExtensionWhenDone" />
        </div>
      </div>
      <div class="transparent-rs-extension-detail-block"></div>
    </div>
  </div>
</template>

<script>
import SignIn from "@/components/SignIn.vue";
import Logout from "@/components/Logout.vue";
import BidPreview from "@/components/BidPreview";
import { mapActions } from "vuex";
import Templates from "@/components/Templates.vue";
import Projects from "@/components/Projects.vue";
import CaseStudies from "@/components/CaseStudies.vue";
import Links from "@/components/Links.vue";
import { upworkPagesWrapMethods } from "@/utility/upworkPagesWrapMethods.js"
import { Tooltip } from 'ant-design-vue';
import { setInitials, getBidCount, clickOutsideExtension, setUp } from "@/utility"
import { PATTERNS, STORAGE } from "@/constants";
import { CopyOutlined, FileOutlined, FileTextOutlined, LinkOutlined, UserOutlined, EyeOutlined, RobotOutlined } from '@ant-design/icons-vue';
export default {
  data() {
    return {
      bidDailyCountByBidder: 0,
      bidMonthlyCountByBidder: 0,
      leadDailyCountByBidder: 0,
      leadMonthlyCountByBidder: 0,
      upworkTargetMonthly: null,
      upworkTargetDaily: null,
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
      showAiComponent: false,
      autoClose: false,
      autoCloseFeature: false,
      otherPage: false,
      currentView: "",
    };
  },
  name: "ExtensionMenu",
  components: {
    SignIn,
    Logout,
    BidPreview,
    Templates,
    Projects,
    Links,
    CaseStudies,
    'a-tooltip': Tooltip,
    CopyOutlined,
    FileOutlined,
    FileTextOutlined,
    LinkOutlined,
    UserOutlined,
    EyeOutlined,
    RobotOutlined
  },
  // wrapMethods is a HOF which will ensure that "Extension context invalidated" error is handled properly
  methods: upworkPagesWrapMethods({
    ...mapActions("currentView", ["updateCurrentView"]),
    async updateTheCurrentView(newView) {
      this.updateCurrentView(newView);
    },
    async handleOpenExtension() {
      const extensionDetailBlock = document.querySelector(
        ".rs-extension-detail-block"
      );
      const extensionDetailBlock2 = document.querySelector(
        ".rs-extension-detail-block2"
      );
      const extensionDetailHead = document.querySelector(
        ".rs-extension-detail-head"
      );
      if (
        extensionDetailBlock.style.display === "none" ||
        extensionDetailBlock.style.display === ""
      ) {
        extensionDetailBlock.style.display = "flex";
      }
      const display = getComputedStyle(extensionDetailBlock2).display;
      const bidder = await chrome.storage.sync.get([STORAGE.BIDDER]);
      // display the right extension block only if the user is logged in
      if (bidder.bidder !== "") {
        if (display === "none") {
          this.rightPortionOpen = true;
          extensionDetailBlock2.style.display = "flex";
          // Use setTimeout to apply the fade-in effect
          setTimeout(() => {
            extensionDetailBlock2.style.opacity = 1;
            extensionDetailHead.style.borderRadius = "0";
            extensionDetailBlock.style.borderRadius = "0";
          }, 300); // Adjust the delay as needed
        }
      }
      if (extensionDetailBlock2.style.display === "flex") {
        // Remove rs-active-tab class from all tabs
        document.querySelectorAll(".rs-li-icon-container").forEach((tab) => {
          tab.classList.remove("rs-active-tab");
        });
        // remove the active tab for ai component if it is active
        document
          .querySelector(".rs-li-icon-container-ai")
          ?.classList.remove("rs-active-tab");
        this.activeTab.classList.add("rs-active-tab");
      }
      if (this.showLogoutScreen) {
        this.showLogoutScreen = false;
      }
    },
    handleCloseExtension() {
      const extensionDetailBlock = document.querySelector(
        ".rs-extension-detail-block"
      );
      const extensionDetailBlock2 = document.querySelector(
        ".rs-extension-detail-block2"
      );
      if (extensionDetailBlock.style.display !== "none") {
        extensionDetailBlock.style.display = "none";
      }
      if (extensionDetailBlock2.style.display !== "none") {
        extensionDetailBlock2.style.display = "none";
      }
    },
    async iconClicked(event) {
      this.currentView = event.currentTarget.id;
      const disabled = document.querySelector(".rs-ext-menu-disabled")
      if (disabled && disabled.contains(event.target)) {
        return; // Do nothing if the element has the class
      }
      if (!this.open && this.bidder === "") {
        this.handleOpenExtension();
        this.open = true;
      } else if (this.open && this.bidder === "") {
        this.handleCloseExtension();
        this.open = false;
      } else if (this.bidder !== "") {
        // take the previous value of this.activeTab because we have to check if the user clicked the same tab
        const prevActiveTabVal = this.activeTab;
        this.activeTab = event.currentTarget;
        if (this.open && prevActiveTabVal === this.activeTab) {
          this.handleCloseExtension();
          this.open = false;
        } else {
          this.handleOpenExtension();
          this.open = true;
        }
      }
    },
    switchView(direction) {
      const views = [
        "rs-templateIcon",
        "rs-projectsIcon",
        "rs-caseStudyIcon",
        "rs-linksIcon",
        "rs-previewIcon",
      ];
      const extensionDetailBlock2 = document.querySelector(
        ".rs-extension-detail-block2"
      );
      if (extensionDetailBlock2.style.display === "flex") {
        document.querySelectorAll(".rs-li-icon-container").forEach((tab) => {
          tab.classList.remove("rs-active-tab");
        });
        const currentIndex = views.indexOf(this.currentView);
        let newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;

        if (newIndex < 0) newIndex = views.length - 1;
        if (newIndex >= views.length) newIndex = 0;

        const newView = views[newIndex];
        const newIcon = document.querySelector(`#${newView}`);
        newIcon.classList.add("rs-active-tab");
        this.currentView = newView;
      }
    },

    goToNext() { this.switchView("next") },

    goToBack() { this.switchView("back") },

    showExtensionBar() {
      const extensionMain = document.querySelector(".rs-extension-main");
      extensionMain.style.left = "0rem";
      const rsLogo = document.querySelector(".rs-logo-container");
      if (rsLogo) {
        rsLogo.style.display = "none"
      }
    },
    hideExtensionBar() {
      const extensionMain = document.querySelector(".rs-extension-main");
      const extensionDetailBlock = document.querySelector(
        ".rs-extension-detail-block"
      );
      if (
        extensionDetailBlock.style.display === "none" ||
        extensionDetailBlock.style.display === ""
      ) {
        extensionMain.style.left = "-5rem";
      }
    },

    clearBidder() {
      this.bidder = "";
      this.showLogoutScreen = false;
    },
    displaySigninScreen() {
      const extensionDetailBlock = document.querySelector(
        ".rs-extension-detail-block"
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
        ".rs-extension-detail-block"
      );
      const extensionDetailBlock2 = document.querySelector(
        ".rs-extension-detail-block2"
      );
      const extensionDetailHead = document.querySelector(
        ".rs-extension-detail-head"
      );
      // if right screen is open, close it
      if (
        extensionDetailBlock2.style.display !== "none" &&
        extensionDetailBlock2.style.display !== ""
      ) {
        extensionDetailBlock2.style.display = "none";
        extensionDetailBlock.style.borderRadius = "0 1rem 1rem 0";
        extensionDetailHead.style.borderRadius = "0 1rem 0 0";
      }
      // Remove rs-active-tab class from all tabs
      document.querySelectorAll(".rs-li-icon-container").forEach((tab) => {
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
        ({ bidDailyCountByBidder: this.bidDailyCountByBidder, bidMonthlyCountByBidder: this.bidMonthlyCountByBidder, leadDailyCountByBidder: this.leadDailyCountByBidder, leadMonthlyCountByBidder: this.leadMonthlyCountByBidder, upworkTargetMonthly: this.upworkTargetMonthly, upworkTargetDaily: this.upworkTargetDaily } = await getBidCount());
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

    async directToLogoutScreen() {
      this.showLogoutScreen = true;
    },

    async signedIn() {
      ({ bidDailyCountByBidder: this.bidDailyCountByBidder, bidMonthlyCountByBidder: this.bidMonthlyCountByBidder, leadDailyCountByBidder: this.leadDailyCountByBidder, leadMonthlyCountByBidder: this.leadMonthlyCountByBidder, upworkTargetMonthly: this.upworkTargetMonthly, upworkTargetDaily: this.upworkTargetDaily } = await getBidCount());
    },

    handleLayoutContainerClick() {
      this.handleCloseExtension()
      this.hideExtensionBar()
      this.open = false;
      const rsLogo = document.querySelector(".rs-logo-container");
      if (rsLogo) {
        rsLogo.style.display = "flex"
      }
    },
    
    handleDocumentClick(event) {
      const extensionMain = document.querySelector(".rs-extension-main");
      const rsLogo = document.querySelector(".rs-logo-container")
      clickOutsideExtension(extensionMain, rsLogo, event, this.handleLayoutContainerClick)
    },

    async handleStorageChange(changes, namespace) {
      if (namespace === "sync" && changes.bidder) {
        const newBidderObj = changes.bidder || { bidder: "" };
        await this.updateBidder(newBidderObj);
      }
    },
    async closeExtensionWhenDone() {
      this.handleLayoutContainerClick();
    },
    async updateBidder(bidderObj) {
      this.bidder = bidderObj.newValue;
      this.initials = bidderObj.newValue
        ? bidderObj.newValue.charAt(0).toUpperCase()
        : "";
      if (this.bidder !== "") {
        // get all industries and linkedin profiles
        // await this.setAutoCloseOnSignIn();
        await this.$store.dispatch("industries/fetchIndustries");
        await this.$store.dispatch("linkedinProfiles/fetchLinkedinProfiles");
        await this.$store.dispatch("upworkProfiles/fetchUpworkProfiles");
        await this.$store.dispatch("countBids/fetchBids");
        await this.$store.dispatch("countLinkedinConnects/fetchLinkedinConnects");

        ({ bidDailyCountByBidder: this.bidDailyCountByBidder, bidMonthlyCountByBidder: this.bidMonthlyCountByBidder, leadDailyCountByBidder: this.leadDailyCountByBidder, leadMonthlyCountByBidder: this.leadMonthlyCountByBidder, upworkTargetMonthly: this.upworkTargetMonthly, upworkTargetDaily: this.upworkTargetDaily } = await getBidCount());

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
    if (PATTERNS.SUBMIT_PROPOSAL.test(window.location.href)) {
      this.showBidPreview = true;
      this.addButton = false;
    } else if (PATTERNS.PROPOSAL_DETAILS.test(window.location.href)) {
      this.addButton = true;
      this.showBidPreview = false;
    } else if (
      (PATTERNS.UPWORK.test(window.location.href) &&
        !PATTERNS.SUBMIT_PROPOSAL.test(window.location.href) &&
        !PATTERNS.PROPOSAL_DETAILS.test(window.location.href))
    ) {
      this.otherPage = true;
      document.addEventListener("click", this.handleDocumentClick);
    }
    ({ bidder: this.bidder, initials: this.initials } = await setInitials());
    // Listen for changes in chrome storage
    chrome.storage.onChanged.addListener(this.handleStorageChange);
    if (this.bidder !== "") {
      await this.$store.dispatch("upworkProfiles/fetchUpworkProfiles");
      await this.$store.dispatch("countBids/fetchBids");
    }
    this.layoutContainer = document.querySelector(".layout-container");
    // add an event listener for the layout-container class which will handle the closure of the extension when user clicks outside the extension, layout-container is the main class of upwork page
    this.layoutContainer?.addEventListener(
      "click",
      this.handleLayoutContainerClick
    );
    this.suggestedTags = this.$store.state.tags.suggestedTags;
    ({ bidDailyCountByBidder: this.bidDailyCountByBidder, bidMonthlyCountByBidder: this.bidMonthlyCountByBidder, leadDailyCountByBidder: this.leadDailyCountByBidder, leadMonthlyCountByBidder: this.leadMonthlyCountByBidder, upworkTargetMonthly: this.upworkTargetMonthly, upworkTargetDaily: this.upworkTargetDaily } = await setUp());
  },

  beforeUnmount() {
    // Remove document click listener
    this.layoutContainer?.removeEventListener(
      "click",
      this.handleLayoutContainerClick
    );
    document.removeListener("click", this.handleDocumentClick);
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

.rs-ext-menu-disabled .rs-li-icon-container {
  cursor: not-allowed !important;
}

#extension-menu-container ::-webkit-scrollbar {
  width: 5px;
}

#extension-menu-container ::-webkit-scrollbar-track:horizontal {
  background: transparent;
  border-radius: 2px;
}

#extension-menu-container ::-webkit-scrollbar-thumb:horizontal {
  background: #75959e;
  border-radius: 2px;
}

#extension-menu-container ::-webkit-scrollbar-thumb:horizontal:hover {
  background: #29454d;
}


#extension-menu-container ::-webkit-scrollbar-track:vertical {
  background: transparent;
  border-radius: 2px;
}

#extension-menu-container ::-webkit-scrollbar-track:horizontal {
  background: transparent;
  border-radius: 2px;
}

#extension-menu-container ::-webkit-scrollbar-thumb:vertical {
  background: #75959e;
  border-radius: 2px;
}

#extension-menu-container ::-webkit-scrollbar-thumb:vertical:hover {
  background: #29454d;
}

*,
#extension-menu-container ::after,
#extension-menu-container ::before {
  box-sizing: border-box;
}

@import "../assets/styles/extensionMenu.css";
</style>
