<template>
  <div v-if="bidder === ''">
    <div class="rs-card-main-signin">
      <strong class="rs-mtb-10">Success!</strong>
      <div>
        Thank you! You have successfully completed the installation. Please reload Upwork
        & Linkedin pages and sign in to continue.
      </div>
      <form class="rs-mtb-10" @submit.prevent="login">
        <div class="rs-custom-field-div">
          <a-input
            class="rs-custom-field-input"
            type="text"
            placeholder="Email"
            v-model:value="email"
            @keydown.enter="triggerSignIn"
          />
        </div>
        <div class="rs-custom-field-div">
          <a-input
            class="rs-custom-field-input"
            :type="passwordVisible ? 'text' : 'password'"
            placeholder="Password"
            v-model:value="password"
            @keydown.enter="triggerSignIn"
          >
            <template #suffix>
              <component
                :is="passwordVisible ? 'EyeInvisibleOutlined' : 'EyeOutlined'"
                @click="togglePasswordVisibility"
                style="cursor: pointer; font-size: 18px"
              />
            </template>
          </a-input>
        </div>
        <p v-if="hasError" class="rs-errorMsg">* {{ errorMessage }}</p>
        <a-button
          class="rs-sign-in"
          block
          @click.stop="login"
          :loading="signInLoading"
          ref="signInButton"
        >
          <span v-if="!signInLoading">Sign In</span>
        </a-button>
      </form>

      <!-- Social Login Button -->
      <a-button
        class="rs-social-login"
        block
        @click="redirectToSocialLogin"
        style="
          margin-top: 1px;
          display: flex;
          align-items: center;
          justify-content: center;
        "
      >
        <img
          src="https://pngimg.com/d/google_PNG19635.png"
          alt="Google Icon"
          style="width: 20px; margin-right: 8px"
        />
        Continue with Google
      </a-button>
    </div>
  </div>

  <div v-else>
    <div class="rs-card-main-logout">
      <div class="rs-popup-main-logout">
        <div class="rs-user-name-icon-container2 mb-1">
          <div class="rs-user-name-popup">
            {{ initials }}
          </div>
          <span>{{ bidder }}</span>
        </div>
        <div class="rs-main-btn-container">
          <a-tooltip title="Expand Slider">
            <a-button @click="viewIconClicked" class="rs-main-btn">
              <EyeOutlined style="font-size: 15px; color: white" />
            </a-button>
          </a-tooltip>
          <div v-if="outerTab === ''">
            <a-tooltip title="Settings">
              <a-button @click="clickSettings" class="rs-main-btn">
                <SettingOutlined style="font-size: 15px; color: white" />
              </a-button>
            </a-tooltip>
          </div>
          <div v-else>
            <a-tooltip title="Back">
              <a-button @click="backToMain" class="rs-main-btn">
                <ArrowLeftOutlined style="font-size: 15px; color: white" />
              </a-button>
            </a-tooltip>
          </div>
          <a href="https://app.restat.io/contact-us" target="_blank">
            <a-tooltip title="Contact Us">
              <a-button class="rs-main-btn">
                <QuestionCircleOutlined style="font-size: 15px; color: #ffffff" />
              </a-button>
            </a-tooltip>
          </a>
        </div>
      </div>
      <div>
        <div v-if="outerTab === ''">
          <div class="rs-mtb-10 rs-tabs-container">
            <a-button
              @click="selectedTab = TABS.UPWORK"
              :class="selectedTab === TABS.UPWORK ? 'rs-tab-btn-active' : 'rs-tab-btn'"
            >
              Upwork
            </a-button>
            <a-button
              @click="selectedTab = TABS.LINKEDIN"
              :class="selectedTab === TABS.LINKEDIN ? 'rs-tab-btn-active' : 'rs-tab-btn'"
            >
              LinkedIn
            </a-button>
          </div>

          <header class="rs-logout-header-popup">
            <p class="rs-heading-area__paragraph">
              Total Monthly
              {{ selectedTab === TABS.UPWORK ? "Proposals" : "Connections" }}:
              {{
                selectedTab === TABS.UPWORK
                  ? bidMonthlyCountByBidder
                  : linkedinConnectMonthlyCountByBidder
              }}
              /
              {{
                selectedTab === TABS.UPWORK ? upworkTargetMonthly : linkedinTargetMonthly
              }}
            </p>
          </header>
          <div class="rs-purple-line-bottom"></div>
          <div class="rs-dash-cards">
            <div class="rs-dash-card rs-dash-card--fb">
              <div class="rs-inlineBlock">
                <div class="rs-followers-info rs-dash-card__followers-info-popup">
                  <h2 class="rs-followers-info__count">
                    {{
                      selectedTab === TABS.UPWORK
                        ? bidDailyCountByBidder
                        : linkedinConnectDailyCountByBidder ?? 0
                    }}
                  </h2>
                  <small class="rs-followers-info__text">
                    {{ selectedTab === TABS.UPWORK ? "Proposals" : "Connections" }}
                  </small>
                </div>

                <div class="rs-followers-info rs-dash-card__followers-info-popup">
                  <h2 class="rs-followers-info__count">
                    {{
                      selectedTab === TABS.UPWORK
                        ? leadDailyCountByBidder
                        : linkedinProspectDailyCountByBidder
                    }}
                  </h2>
                  <small class="rs-followers-info__text">
                    {{ selectedTab === TABS.UPWORK ? "Leads" : "Prospects" }}
                  </small>
                </div>
              </div>
              <div class="rs-date-info rs-dash-card__rs-date-info mb-4 mt-2">
                <small
                  v-if="selectedTab === TABS.UPWORK && upworkTargetDaily === noTarget"
                  >{{ upworkTargetDaily }}</small
                >
                <small
                  v-else-if="
                    selectedTab === TABS.LINKEDIN && linkedinTargetDaily === noTarget
                  "
                  >{{ linkedinTargetDaily }}</small
                >
                <small v-else class="rs-date-info__date">
                  {{
                    selectedTab === TABS.UPWORK
                      ? upworkTargetDaily - bidDailyCountByBidder
                      : linkedinTargetDaily - linkedinConnectDailyCountByBidder
                  }}
                  Remaining
                </small>
              </div>
              <a-alert
                class="rs-alert"
                message="Please go to Upwork or LinkedIn pages to see additional features."
                type="info"
                show-icon
              />
            </div>
          </div>
        </div>
        <div v-else>
          <div class="rs-default-tab-selection rs-settings">
            <div class="rs-default-tab-title">Select Your Default Tab</div>
            <a-radio-group v-model:value="defaultTab" class="rs-default-tab-radio-group">
              <a-radio @click="setDefaultTab(TABS.UPWORK)" :value="TABS.UPWORK"
                >Upwork</a-radio
              >
              <a-radio @click="setDefaultTab(TABS.LINKEDIN)" :value="TABS.LINKEDIN"
                >Linkedin</a-radio
              >
            </a-radio-group>
          </div>
          <a-tooltip title="Log Out">
            <a-button @click="logout" class="rs-main-btn">
              <LogoutOutlined style="font-size: 15px; color: #ffffff" />
            </a-button>
          </a-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { captureExtensionError, handleRuntimeMessage } from "@/utility/parserHelper";
import { setUserSettings } from "@/provider";
import { Radio, Button, Alert, Input, Tooltip } from "ant-design-vue";
import { signInWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import {
  FIREBASE_USER_NOT_FOUND,
  FIREBASE_AUTH_WRONG_PASSWORD,
  FIREBASE_AUTH_USER_DISABLED,
  FIREBASE_AUTH_TOO_MANY_REQUESTS,
} from "../firebase/constants";
import { authenticateUser } from "../provider";
import { setUp } from "@/utility";
import { logoutSetup } from "@/utility";
import { MESSAGES, TABS, TARGET, OUTER_TAB } from "@/constants";
import {
  EyeOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons-vue";
export default {
  name: "mainPopup",
  components: {
    "a-radio-group": Radio.Group, // Register Radio Group
    "a-radio": Radio, // Register traditional Radio
    "a-button": Button,
    "a-alert": Alert,
    "a-input": Input,
    "a-tooltip": Tooltip,
    EyeOutlined,
    SettingOutlined,
    ArrowLeftOutlined,
    LogoutOutlined,
    QuestionCircleOutlined,
    EyeInvisibleOutlined,
  },
  data() {
    return {
      email: "",
      password: "",
      hasError: false,
      errorMessage: "",
      totalBids: 20,
      bidDailyCountByBidder: 0,
      bidMonthlyCountByBidder: 0,
      leadDailyCountByBidder: 0,
      leadMonthlyCountByBidder: 0,
      upworkTargetDaily: null,
      upworkTargetMonthly: null,
      linkedinTargetDaily: null,
      linkedinTargetMonthly: null,
      linkedinConnectMonthlyCountByBidder: 0,
      linkedinConnectDailyCountByBidder: 0,
      linkedinProspectMonthlyCountByBidder: 0,
      linkedinProspectDailyCountByBidder: 0,
      bidder: "",
      initials: "",
      outerTab: "",
      defaultTab: "",
      selectedTab: "",
      signInLoading: false,
      logoutLoading: false,
      noTarget: TARGET.UNSET,
      passwordVisible: false,
      TABS,
      OUTER_TAB,
    };
  },

  methods: {
    validEmail: function (email) {
      var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(email);
    },

    async setTheDefaultTab() {
      ({
        defaultTab: this.defaultTab,
        bidder: this.bidder,
        initials: this.initials,
        bidDailyCountByBidder: this.bidDailyCountByBidder,
        bidMonthlyCountByBidder: this.bidMonthlyCountByBidder,
        leadDailyCountByBidder: this.leadDailyCountByBidder,
        leadMonthlyCountByBidder: this.leadMonthlyCountByBidder,
        upworkTargetDaily: this.upworkTargetDaily,
        upworkTargetMonthly: this.upworkTargetMonthly,
        linkedinConnectDailyCountByBidder: this.linkedinConnectDailyCountByBidder,
        linkedinConnectMonthlyCountByBidder: this.linkedinConnectMonthlyCountByBidder,
        linkedinProspectMonthlyCountByBidder: this.linkedinProspectMonthlyCountByBidder,
        linkedinProspectDailyCountByBidder: this.linkedinProspectDailyCountByBidder,
        linkedinTargetMonthly: this.linkedinTargetMonthly,
        linkedinTargetDaily: this.linkedinTargetDaily,
      } = await setUp());
      this.selectedTab = this.defaultTab;
    },

    async setDefaultTab(val) {
      this.defaultTab = val;
      try {
        const { settings: userSettings } = await setUserSettings({
          defaultTab: this.defaultTab,
        });
        if (this.defaultTab === TABS.UPWORK) {
          handleRuntimeMessage({
            message: MESSAGES.UPDATE_BADGE,
            count: this.bidDailyCountByBidder,
          });
        } else if (this.defaultTab === TABS.LINKEDIN) {
          handleRuntimeMessage({
            message: MESSAGES.UPDATE_BADGE,
            count: this.linkedinConnectDailyCountByBidder,
          });
        }
        const settings = {};
        if (userSettings) {
          settings.settings = userSettings;
          await chrome.storage.sync.set(settings);
        }
      } catch (err) {
        captureExtensionError(err);
      }
    },

    backToMain() {
      this.outerTab = "";
    },

    redirectToSocialLogin() {
      // Fetch the extension's manifest name
      const extensionName = chrome.runtime.getManifest().name;

      // Determine the redirect URL based on the extension name
      let url = "https://app.restat.io/extension/sign-in";
      if (extensionName.includes("Staging")) {
        url = "https://staging.app.restat.io/extension/sign-in";
      } else if (extensionName.includes("Local")) {
        url = "http://localhost:3000/extension/sign-in";
      }
      window.open(url, "_blank");
    },

    async login() {
      this.signInLoading = true;
      if (this.isLoggedIn) {
        return;
      }

      this.isLoggedIn = true;

      if (this.email === "" || !this.validEmail(this.email)) {
        this.hasError = true;
        this.errorMessage = "Email is either empty or invalid!";
        this.signInLoading = false;
        this.isLoggedIn = false;
        return;
      }

      const passwordRules = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
      // Combined validation for empty password and password rules
      if (this.password === "" || !passwordRules.test(this.password)) {
        this.hasError = true;
        this.errorMessage =
          this.password === ""
            ? "Password is empty!"
            : "Password must be at least 8 characters, with one uppercase letter, one lowercase letter, and one digit.";
        this.signInLoading = false;
        this.isLoggedIn = false;
        return;
      }

      try {
        this.hasError = false;
        const providers = await fetchSignInMethodsForEmail(auth, this.email);
        if (providers.length === 0) {
          // No providers found for this email, so the user doesn't have an account
          this.hasError = true;
          this.isLoggedIn = false;
          this.signInLoading = false;
          this.errorMessage = "No account found with this email!";
        } else if (providers.includes("password")) {
          // Email is linked to password-based sign-in, proceed with password sign-in
          const { user } = await signInWithEmailAndPassword(
            auth,
            this.email,
            this.password
          );
          const idToken = await user.getIdToken();
          await authenticateUser(idToken);
          // get all industries and linkedin profiles
          await this.$store.dispatch("industries/fetchIndustries");
          await this.$store.dispatch("linkedinProfiles/fetchLinkedinProfiles");
          await this.$store.dispatch("upworkProfiles/fetchUpworkProfiles");
          await this.$store.dispatch("countBids/fetchBids");
          await this.$store.dispatch("countLinkedinConnects/fetchLinkedinConnects");
          handleRuntimeMessage({
            message: MESSAGES.ADD_BUTTONS,
          });
          this.signInLoading = false;
          await this.setTheDefaultTab();
          handleRuntimeMessage({
            message: MESSAGES.UPDATE_UPWORK_PROFILE,
          });
          handleRuntimeMessage({
            message: MESSAGES.UPDATE_LINKEDIN_PROFILE,
          });
        } else {
          // Email is linked to a different provider (e.g., Google)
          this.hasError = true;
          this.isLoggedIn = false;
          this.signInLoading = false;
          this.errorMessage =
            "It looks like you logged in using Google. Please continue with Google Sign-In.";
        }
      } catch (error) {
        this.hasError = true;
        this.isLoggedIn = false;
        this.signInLoading = false;
        if (error.code === FIREBASE_USER_NOT_FOUND) {
          this.errorMessage = "No user found with this email.";
        } else if (error.code === FIREBASE_AUTH_WRONG_PASSWORD) {
          this.errorMessage = "The provided password is incorrect.";
        } else if (error.code === FIREBASE_AUTH_USER_DISABLED) {
          this.errorMessage = "User account is disabled.";
        } else if (error.code === FIREBASE_AUTH_TOO_MANY_REQUESTS) {
          this.errorMessage =
            "Too many unsuccessful sign-in attempts. Pleasee try again later";
        } else {
          captureExtensionError(error);
          this.errorMessage = "Invalid Username or Password!";
        }
      }
    },

    async logout() {
      try {
        this.bidder = "";
        this.logoutLoading = true;
        await logoutSetup();
        handleRuntimeMessage({
          message: MESSAGES.UPDATE_BADGE,
          count: 0,
        });
        // close the right extension bar if user logs out
        const extensionDetailBlock = document.querySelector(".rs-extension-detail-block");
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
        });
        this.logoutLoading = false;
      } catch (err) {
        captureExtensionError(err);
      }
    },

    async viewIconClicked() {
      try {
        const response = await this.sendMessageToContentScript();
        if (!response) {
          handleRuntimeMessage({ message: MESSAGES.ALERT_CURRENT_TAB });
          return;
        }
        handleRuntimeMessage({ message: MESSAGES.SHOW_SIDE_PANEL });
      } catch (error) {
        captureExtensionError(error);
      }
    },

    async sendMessageToContentScript() {
      try {
        const tab = await this.getActiveTab();

        if (!tab?.id) {
          return false;
        }

        chrome.tabs.sendMessage(
          tab.id,
          {
            sent: MESSAGES.CHECK_CONTENT_SCRIPT,
            message: "success",
          },
          function (response) {
            if (chrome.runtime.lastError) {
              captureExtensionError(chrome.runtime.lastError);
            } else {
              captureExtensionError(response.message);
            }
          }
        );

        const response = await this.waitForContentScript();

        return response;
      } catch {
        // Intentionally left blank
        return false;
      }
    },

    async getActiveTab() {
      return new Promise((resolve) =>
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => resolve(tab))
      );
    },

    async clickSettings() {
      this.outerTab = OUTER_TAB.SETTINGS;
    },

    async waitForContentScript() {
      return new Promise((resolve) => {
        chrome.runtime.onMessage.addListener(function listener(request) {
          if (request.message === "content-script-loaded") {
            chrome.runtime.onMessage.removeListener(listener);
            resolve(true);
          }
        });

        setTimeout(() => {
          resolve(false);
        }, 2000);
      });
    },

    triggerSignIn() {
      this.$refs.signInButton.$el.click();
    },

    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible;
    },
  },
  async mounted() {
    await this.setTheDefaultTab();
  },
};
</script>

<style scoped>
:root {
  /* Dark Theme Colors */
  --restat-background: #28303f;
  --restat-button: #5865f2;
}

.rs-default-tab-selection {
  margin-top: 2rem;
}

.rs-default-tab-title {
  margin-bottom: 0.5rem;
}

.rs-default-tab-radio-group {
  margin-top: 0.5rem;
}

.rs-default-tab-radio-group .ant-radio-wrapper {
  color: white !important;
}

.rs-signin-btn {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  color: white !important;
  background-color: #5865f2;
  border: 1px solid #5865f2;
  border-radius: 10px !important;
}

.rs-tab-btn-active {
  padding: 3px;
  color: white;
  margin-right: 0.5rem;
  background-color: #5865f2;
  border: 1px solid #5865f2;
  border-radius: 3px;
}

.rs-tab-btn-active:hover {
  color: white;
}

.rs-tab-btn {
  padding: 3px;
  color: white;
  margin-right: 0.5rem;
  background-color: #343e50;
  border: 1px solid #343e50;
  border-radius: 3px;
  cursor: pointer;
}

.rs-tab-btn:hover {
  background-color: #5865f2;
  border: 1px solid #5865f2;
  color: white;
}

.rs-card-main-signin {
  width: 350px;
  height: 370px;
  background-color: #343e50;
  color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  border: 1px solid #343e50;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 2rem;
  padding-right: 2rem;
  font-size: 14px;
}

.rs-card-main-logout {
  width: 400px;
  height: 390px;
  background-color: #28303f;
  color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  border: 1px solid #28303f;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 1rem;
  /* justify-content: center; */
}

.rs-popup-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.rs-popup-main-logout {
  display: flex;
  width: 350px;
  justify-content: space-between;
}

/* Ensures the alert itself does not expand beyond its container */
.rs-alert {
  margin-top: 1rem;
  background-color: rgba(88, 101, 242, 0.3);
  color: white;
  max-width: 90%;
  font-size: 11px;
  box-sizing: border-box;
}

/* Ensures the buttons remain aligned */
.rs-tabs-container {
  width: 40%;
  margin-left: 0.5rem;
  display: flex;
  justify-content: space-between;
  /* Evenly spaces the buttons */
  margin-top: 10px;
}

.rs-tab-btn,
.rs-tab-btn-active {
  flex: 1;
  text-align: center;
  margin: 0 5px;
}

.rs-dash-card__rs-date-info {
  width: 85%;
  text-align: center;
  margin-top: 10px;
  background-color: #5865f2;
  border: 1px solid #5865f2;
  border-radius: 3px;
}

.rs-main-btn-container {
  display: flex;
  gap: 1rem;
}

.rs-main-btn {
  background-color: #343e50;
  color: white;
  margin-top: 1rem;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  border: 1px solid #5865f2;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

.rs-main-btn:hover {
  border: 1px solid #5865f2;
  background-color: #5865f2;
}

.rs-main-btn-active {
  border: 1px solid #5865f2;
  background-color: #5865f2;
  color: white;
  margin-top: 1rem;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.rs-user-name-icon-container2 {
  display: flex;
  align-items: center;
  justify-content: center;
}

.rs-user-name-popup {
  margin-right: 0.5rem;
  text-decoration: none !important;
  color: white !important;
  background-color: #5865f2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 40px;
}

.rs-logout-header-popup {
  display: flex;
  flex-direction: column;
  align-items: baseline;
  justify-content: center;
  width: 90%;
  margin-left: 1rem;
  margin-right: 2rem;
}

.rs-purple-line-bottom {
  width: 90%;
  margin-left: 1rem;
  margin-right: 2rem;
  margin-top: 1rem;
  border-bottom: 0.2rem solid #5865f2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rs-settings {
  width: 100%;
  border-top: 0.2rem solid #5865f2;
  padding-top: 2rem;
  padding-bottom: 2rem;
  border-bottom: 0.2rem solid #5865f2;
}

.rs-heading-area__paragraph {
  margin-top: 0.5em;
  opacity: 0.8;
  margin-bottom: 0;
  color: white !important;
}

/* Card */
.rs-dash-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-top: 0.1875rem solid transparent;
  border-radius: 10px;
  padding-top: 10px;
  text-align: center;
  overflow: hidden;
}

/* Card Top Border Style */
.rs-dash-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 0.25rem;
  background-color: transparent;
}

.rs-dash-card__user-info {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
  /* Add margin as per your preference */
}

.rs-dash-card__followers-info-popup {
  margin: 5px;
  color: #5865f2;
  background-color: #343e50;
  min-width: 120px;
  height: 90px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 2px;
}

.rs-inlineBlock {
  display: flex;
  justify-content: space-between;
}

.rs-followers-info__count {
  font-size: 3.75rem;
  margin: 0;
  color: white !important;
}

.rs-followers-info__text {
  font-weight: 100;
  text-transform: uppercase;
  letter-spacing: 0.3rem;
  color: white;
}

.rs-date-info {
  background-color: #5865f2;
  border-radius: 10px;
  color: white;
  padding: 5px 8px;
  margin-top: 10px;
}

.rs-mtb-10 {
  margin-top: 10px;
  margin-bottom: 10px;
}
</style>
