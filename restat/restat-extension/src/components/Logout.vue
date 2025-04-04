<template>
  <div v-if="!linkedinPage">
    <div v-if="showAiComponent">
      <AiComponent />
    </div>
    <div v-else>
      <div class="rs-extension-detail-head">
        <span><strong>User Account</strong> - Logout Screen</span>
      </div>
      <div class="rs-extension-detail-body">
        <header class="rs-logout-header">
          <div class="rs-heading-area header__rs-heading-area">
            <h1 class="rs-heading-area__title">Upwork Dashboard</h1>
            <p class="rs-heading-area__paragraph">
              Total Monthly Proposals: {{ bidMonthlyCountByBidder }} / {{ upworkTargetMonthly }}
            </p>
            <div class="rs-select-box-upwork mt-2">
              <p class="rs-heading-area__paragraph rs-mr-20">Profile:</p>
              <div class="rs-custom-select-upwork">
                <select id="selectProfile" v-model="selectedUpworkProfile" @change="selectUpworkProfile">
                  <option disabled value="">Select Profile</option>
                  <option :key="profile._id" v-for="profile in upworkProfiles" :value="profile.name">
                    {{ profile.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </header>

        <div class="rs-dash-cards">
          <div class="rs-dash-card rs-dash-card--fb">
            <div class="rs-user-info rs-dash-card__user-info">
              <div>
                <div class="rs-user-name-icon-container2 mb-1">
                  <div class="rs-user-name2">
                    {{ initials }}
                  </div>
                  <span>{{ bidder }}</span>
                </div>
              </div>
            </div>

            <div class="rs-inlineBlock-upwork">
              <div class="rs-followers-info rs-dash-card__followers-info">
                <h2 class="rs-followers-info__count">
                  {{ bidDailyCountByBidder }}
                </h2>
                <small class="rs-followers-info__text">Proposals</small>
              </div>
              <div class="rs-followers-info rs-dash-card__followers-info">
                <h2 class="rs-followers-info__count">
                  {{ leadDailyCountByBidder }}
                </h2>
                <small class="rs-followers-info__text">Leads</small>
              </div>
            </div>
            <div class="rs-date-info rs-dash-card__rs-date-info mb-4 mt-2">
              <small v-if="upworkTargetDaily === noTarget" class="rs-date-info__date">{{ upworkTargetDaily }}</small>
              <small v-else class="rs-date-info__date">{{ upworkTargetDaily - bidDailyCountByBidder }} Remaining</small>
            </div>
            <div class="rs-purple-line rs-purple-line-margin"></div>
          </div>
        </div>
        <a-button class="rs-sign-in" block @click="logout" :loading="logoutLoading">
          Log Out
        </a-button>
      </div>
    </div>
  </div>
  <div v-else>
    <div v-if="showAiComponent">
      <AiComponent />
    </div>
    <div v-else>
      <div class="rs-extension-detail-head-linkedin">
        <span><strong>User Account</strong> - Logout Screen</span>
      </div>
      <div class="rs-extension-detail-body-linkedin">
        <header class="rs-logout-header">
          <div class="rs-heading-area header__rs-heading-area">
            <h1 class="rs-heading-area__title">Linkedin Dashboard</h1>
            <p class="rs-heading-area__paragraph">
              Total Monthly Connections: {{ linkedinConnectMonthlyCountByBidder }} / {{ linkedinTargetMonthly }}
            </p>
            <div class="rs-select-box">
              <p class="rs-heading-area__paragraph rs-mr-10">Industry:</p>
              <div class="rs-custom-select">
                <select id="selectIndustry" v-model="selectedIndustry" @change="selectIndustry">
                  <option disabled value="">Select Industry</option>
                  <option :key="industry._id" v-for="industry in industries" :value="industry.name">
                    {{ industry.name }}
                  </option>
                </select>
              </div>
            </div>
            <div class="rs-select-box mt-2">
              <p class="rs-heading-area__paragraph rs-mr-20">Profile:</p>
              <div class="rs-custom-select">
                <select id="selectProfile" v-model="selectedLinkedinProfile" @change="selectLinkedinProfile">
                  <option disabled value="">Select Profile</option>
                  <option :key="profile._id" v-for="profile in linkedinProfiles" :value="profile.name">
                    {{ profile.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </header>

        <div class="rs-dash-cards">
          <div class="rs-dash-card rs-dash-card--fb">
            <div class="rs-user-info rs-dash-card__user-info">
              <div>
                <div class="rs-user-name-icon-container2 mb-1">
                  <div class="rs-user-name2">
                    {{ initials }}
                  </div>
                  <span>{{ bidder }}</span>
                </div>
              </div>
            </div>

            <div class="rs-inlineBlock-linkedin mb-2">
              <div class="rs-followers-info rs-dash-card__followers-info">
                <h2 class="rs-followers-info__count">
                  {{ linkedinConnectDailyCountByBidder }}
                </h2>
                <small class="rs-followers-info__text">Connections</small>
              </div>
              <div class="rs-followers-info rs-dash-card__followers-info">
                <h2 class="rs-followers-info__count">
                  {{ linkedinProspectDailyCountByBidder }}
                </h2>
                <small class="rs-followers-info__text">Prospects</small>
              </div>
            </div>
            <div class="rs-date-info rs-dash-card__rs-date-info">
              <small v-if="linkedinTargetDaily === noTarget" class="rs-date-info__date">{{ linkedinTargetDaily
                }}</small>
              <small v-else class="rs-date-info__date">{{
    linkedinTargetDaily - linkedinConnectDailyCountByBidder
                }}
                Remaining</small>
            </div>
            <div class="rs-purple-line rs-purple-line-margin-linkedin"></div>
          </div>
        </div>

        <a-button class="rs-sign-in-linkedin" block @click="logout" :loading="logoutLoading">
          Log Out
        </a-button>
      </div>
    </div>
  </div>
</template>

<script>
import { handleRuntimeMessage } from "@/utility/parserHelper";
import AiComponent from "./AI.vue";
import { Button } from 'ant-design-vue';
import { logoutSetup } from "@/utility";
import { MESSAGES, STORAGE, TARGET } from "@/constants";
export default {
  name: "LogOut",
  props: [
    "initials",
    "bidder",
    "addButton",
    "linkedinPage",
    "showAiComponent",
    "bidDailyCountByBidder",
    "bidMonthlyCountByBidder",
    "leadDailyCountByBidder",
    "leadMonthlyCountByBidder",
    "upworkTargetMonthly",
    "upworkTargetDaily",
    "linkedinTargetMonthly",
    "linkedinTargetDaily",
    "linkedinConnectDailyCountByBidder",
    "linkedinConnectMonthlyCountByBidder",
    "linkedinProspectDailyCountByBidder",
    "linkedinProspectMonthlyCountByBidder",
    "autoClose",
    "autoCloseFeature",
    "theSelectedUpworkProfile"
  ],
  emits: ["clearTheBidder"],
  components: { AiComponent, 'a-button': Button },
  data() {
    return {
      connectMonthlyCountByBusinessDev: 0,
      connectDailyCountByBusinessDev: 0,
      totalBids: 20,
      totalConnects: 20,
      selectedIndustry: "",
      industries: [],
      selectedLinkedinProfile: "",
      linkedinProfiles: [],
      selectedUpworkProfile: "",
      upworkProfiles: [],
      logoutLoading: false,
      noTarget: TARGET.UNSET
    };
  },

  // logoutWrapMethods is a HOF which will ensure that "Extension context invalidated" error is handled properly
  methods: {
    async logout() {
      this.logoutLoading = true;
      this.$emit("clearTheBidder");
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
      handleRuntimeMessage({
        message: MESSAGES.REMOVE_BUTTONS,
      })
      this.logoutLoading = false;
    },

    async selectIndustry() {
      // Find the selected industry object
      const industry = this.industries.find(
        (ind) => ind.name === this.selectedIndustry
      );
      if (industry) {
        // Save the industry object in chrome.storage.sync
        await chrome.storage.sync.set({ industry: JSON.stringify(industry) });
      }
    },

    async selectLinkedinProfile() {
      const linkedinProfile = this.linkedinProfiles.find(
        (prof) => prof.name === this.selectedLinkedinProfile
      );
      if (linkedinProfile) {
        // Save the profile object in chrome.storage.sync
        await chrome.storage.sync.set({
          linkedinProfile: JSON.stringify(linkedinProfile),
        });
      }
    },

    async selectUpworkProfile() {
      const upworkProfile = this.upworkProfiles.find(
        (prof) => prof.name === this.selectedUpworkProfile
      );
      if (upworkProfile) {
        // Save the profile object in chrome.storage.sync
        await chrome.storage.sync.set({
          upworkProfile: JSON.stringify(upworkProfile),
        });
      }
    },
  },
  
  async mounted() {
    if (this.addButton) {
      const userIcon = document
        .querySelector(".rs-ext-bottom .rs-li-icon-container")
        ?.querySelector(".rs-user-name")?.parentElement;
      const userIconLinkedin = document
        .querySelector(".rs-ext-bottom .rs-li-icon-container-linkedin")
        ?.querySelector(".rs-user-name-linkedin")?.parentElement;
      if (
        userIcon &&
        !userIcon.classList.contains("rs-active-tab") &&
        !this.showAiComponent
      ) {
        userIcon.classList.add("rs-active-tab");
      }
      if (
        userIconLinkedin &&
        !userIconLinkedin.classList.contains("rs-active-tab")
      ) {
        userIconLinkedin.classList.add("rs-active-tab");
      }
    }
    // Get initial value of upworkProfile and linkedinProfile from chrome.storage
    const {upworkProfile} = await chrome.storage.sync.get([STORAGE.UPWORK_PROFILE]);
    const {linkedinProfile} = await chrome.storage.sync.get([STORAGE.LINKEDIN_PROFILE])

    // Set the selected profiles if they exist
    if (upworkProfile) {
      this.selectedUpworkProfile = JSON.parse(upworkProfile).name;
    }

    if (linkedinProfile) {
      this.selectedLinkedinProfile = JSON.parse(linkedinProfile).name;
    }

    // Listen for changes in chrome.storage for both upworkProfile and linkedinProfile
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        if (changes.upworkProfile) {
          this.selectedUpworkProfile = changes.upworkProfile.newValue && JSON.parse(changes.upworkProfile.newValue).name;
        }
        if (changes.linkedinProfile) {
          this.selectedLinkedinProfile = changes.linkedinProfile.newValue && JSON.parse(changes.linkedinProfile.newValue).name;
        }
      }
    });

    if (this.linkedinPage) {
      let industries = this.$store.state.industries.industries;
      this.industries = industries.industries;
      const selectedIndustry = await chrome.storage.sync.get([STORAGE.INDUSTRY]);
      if (selectedIndustry.industry) {
        this.selectedIndustry = JSON.parse(selectedIndustry.industry).name;
      }

      let linkedinProfiles =
        this.$store.state.linkedinProfiles.linkedinProfiles;
      this.linkedinProfiles = linkedinProfiles.profiles;

    } else {
      let upworkProfiles = this.$store.state.upworkProfiles.upworkProfiles;
      this.upworkProfiles = upworkProfiles.profiles;
    }

  },
};
</script>

<style>
.rs-purple-line-margin-linkedin {
  margin-top: 2rem;
  margin-bottom: 2rem;
}

.rs-purple-line-margin {
  margin-top: 1.2rem;
  margin-bottom: 1.5rem;
}
</style>
@/utility/parserHelper