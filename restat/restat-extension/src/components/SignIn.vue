<template>
  <div v-if="isComponentLoaded">
    <div v-if="bidder === ''">
      <div
        :class="{
          'rs-extension-detail-head': !linkedinPage,
          'rs-extension-detail-head-linkedin': linkedinPage,
        }"
      >
        <span><strong>Sign In</strong> - Sign in to generate a bid</span>
      </div>
      <div
        :class="{
          'rs-extension-detail-body': !linkedinPage,
          'rs-extension-detail-body-linkedin': linkedinPage,
        }"
      >
        <form class="my-3" @submit.prevent="login">
          <div
            :class="{
              'rs-custom-field-div': !linkedinPage,
              'rs-custom-field-div-linkedin': linkedinPage,
            }"
          >
            <a-input
              :class="{
                'rs-custom-field-input': !linkedinPage,
                'rs-custom-field-input-linkedin': linkedinPage,
              }"
              type="text"
              placeholder="Email"
              v-model:value="email"
              @keydown.enter="triggerSignIn"
            />
          </div>

          <div
            :class="{
              'rs-custom-field-div': !linkedinPage,
              'rs-custom-field-div-linkedin': linkedinPage,
            }"
          >
            <a-input
              :class="{
                'rs-custom-field-input': !linkedinPage,
                'rs-custom-field-input-linkedin': linkedinPage,
              }"
              :type="passwordVisible ? 'text' : 'password'"
              placeholder="Password"
              v-model:value="password"
              @keydown.enter="triggerSignIn"
            >
              <template #suffix>
                <component
                  :is="passwordVisible ? 'EyeInvisibleOutlined' : 'EyeOutlined'"
                  @click.stop="togglePasswordVisibility"
                  style="cursor: pointer; font-size: 18px"
                />
              </template>
            </a-input>
          </div>
          <p v-if="hasError" class="rs-errorMsg">* {{ errorMessage }}</p>
          <a-button
            :class="{ 'rs-sign-in': !linkedinPage, 'rs-sign-in-linkedin': linkedinPage }"
            block
            @click.stop="login"
            :loading="signInLoading"
            ref="signInButton"
          >
            <span v-if="!signInLoading">Sign In</span>
          </a-button>
        </form>
      </div>
    </div>

    <div v-else-if="bidder !== '' && !addButton && !otherPage">
      <div class="rs-extension-detail-head">
        <span><strong>Search</strong> - Search through tags and apply filters</span>
        <div
          class="rs-cross-icon-hidden"
          :class="{ 'rs-cross-icon-shown': !rightPortionOpen }"
        ></div>
      </div>
      <div class="rs-extension-detail-body">
        <Search
          :search="search"
          :item="'Tag'"
          :noMatched="noTagsMatched"
          :searchResult="searchResult"
          :searchBox="searchBox"
          :loading="loadingSearch"
          @handleClicked="handleTagClick($event)"
          @onTheChangeSearch="onChangeSearch($event)"
          @closeTheSearch="closeSearchBox"
        />
        <ExploreTags
          @toggleTheOpenTags="handleToggleOpenTags('SuggestedTags')"
          :showOpenTags="showOpenTags.SuggestedTags"
          :componentName="'SuggestedTags'"
          :title="'Suggested Tags based on the Job Proposal'"
          :noTags="'No Matching tags found!'"
          :suggestedTags="suggestedTags"
          :loading="loading"
          :selectedTags="selectedTags"
          :tagsCount="tagsCount"
          :tagsPerPage="tagsPerPage"
          :suggestedTagsPage="suggestedTagsPage"
          @selectDeselectTags="selectDeselectTheTags($event)"
          @loadTheNextSuggestedTags="loadNextSuggestedTags"
          @loadThePrevSuggestedTags="loadPrevSuggestedTags"
        />
        <ExploreTags
          @toggleTheOpenTags="handleToggleOpenTags('SelectedTags')"
          :showOpenTags="showOpenTags.SelectedTags"
          :componentName="'SelectedTags'"
          :title="'Selected Tags'"
          :noTags="'No Tags selected!'"
          :loading="false"
          :selectedTags="selectedTags"
          @removeTag="removeTheTag($event)"
        />
      </div>
    </div>

    <div v-else>
      <div
        :class="{
          'rs-extension-detail-head': !linkedinPage,
          'rs-extension-detail-head-linkedin': linkedinPage,
        }"
      >
        <span><strong>Sign In</strong> - Sign in to generate a bid</span>
      </div>
      <div
        :class="{
          'rs-extension-detail-body': !linkedinPage,
          'rs-extension-detail-body-linkedin': linkedinPage,
        }"
      >
        <form class="my-3" @submit.prevent="login">
          <div
            :class="{
              'rs-custom-field-div': !linkedinPage,
              'rs-custom-field-div-linkedin': linkedinPage,
            }"
          >
            <a-input
              :class="{
                'rs-custom-field-input': !linkedinPage,
                'rs-custom-field-input-linkedin': linkedinPage,
              }"
              type="text"
              placeholder="Email"
              v-model:value="email"
              @keydown.enter="triggerSignIn"
            />
          </div>
          <div
            :class="{
              'rs-custom-field-div': !linkedinPage,
              'rs-custom-field-div-linkedin': linkedinPage,
            }"
          >
            <a-input
              :class="{
                'rs-custom-field-input': !linkedinPage,
                'rs-custom-field-input-linkedin': linkedinPage,
              }"
              :type="passwordVisible ? 'text' : 'password'"
              placeholder="Password"
              v-model:value="password"
              @keydown.enter="triggerSignIn"
            >
              <template #suffix>
                <component
                  :is="passwordVisible ? 'EyeInvisibleOutlined' : 'EyeOutlined'"
                  @click.stop="togglePasswordVisibility"
                  style="cursor: pointer; font-size: 18px"
                />
              </template>
            </a-input>
          </div>
          <p v-if="hasError" class="rs-errorMsg">* {{ errorMessage }}</p>
          <a-button
            :class="{ 'rs-sign-in': !linkedinPage, 'rs-sign-in-linkedin': linkedinPage }"
            block
            @click.stop="login"
            :loading="signInLoading"
            ref="signInButton"
          >
            <span v-if="!signInLoading">Sign In</span>
          </a-button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { signInWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import ExploreTags from "./ExploreTags.vue";
import { getTags } from "@/provider";
import { debounce } from "../utility/debounce";
import { mapActions } from "vuex";
import Search from "./Search.vue";
import {
  FIREBASE_USER_NOT_FOUND,
  FIREBASE_AUTH_WRONG_PASSWORD,
  FIREBASE_AUTH_USER_DISABLED,
  FIREBASE_AUTH_TOO_MANY_REQUESTS,
} from "../firebase/constants";
import { authenticateUser } from "../provider";
import { captureExtensionError, handleRuntimeMessage } from "@/utility/parserHelper";
import { Button, Input } from "ant-design-vue";
import { MESSAGES, PATTERNS, STORAGE, TABS } from "@/constants";
import { getDefaultTab } from "@/utility";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons-vue";
export default {
  name: "SignIn",
  props: ["rightPortionOpen", "addButton", "linkedinPage", "bidder", "initials"],
  components: {
    ExploreTags,
    Search,
    "a-button": Button,
    "a-input": Input,
    EyeOutlined,
    EyeInvisibleOutlined,
  },
  data() {
    return {
      email: "",
      password: "",
      emptyFields: false,
      hasError: false,
      errorMessage: "",
      isComponentLoaded: false,
      showOpenTags: {
        SuggestedTags: true,
        SelectedTags: true,
      },
      suggestedTags: [],
      selectedTags: [],
      loading: false,
      signInLoading: false,
      loadingSearch: false,
      searchBox: false,
      searchResult: [],
      search: "",
      noTagsMatched: false,
      tagsCount: 0,
      tagsPerPage: 0,
      suggestedTagsPage: 1,
      isLoggedIn: false,
      otherPage: false,
      passwordVisible: false,
    };
  },

  // signinWrapMethods is a HOF which will ensure that "Extension context invalidated" error is handled properly
  methods: {
    validEmail: function (email) {
      var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(email);
    },

    ...mapActions("tags", [
      "updateSelectedTags",
      "updateAllTagsPage",
      "updateSuggestedTagsPage",
    ]),
    ...mapActions("projects", ["updateMatchedProjectsPage"]),
    ...mapActions("templates", ["updateMatchedTemplatesPage"]),
    ...mapActions("links", ["updatematchedLinksPage"]),
    ...mapActions("caseStudies", ["updateMatchedCaseStudiesPage"]),
    ...mapActions("loading", ["updateLoading"]),

    async updateSuggestedProjectsPageHandler(newPage) {
      await this.updateMatchedProjectsPage(newPage);
    },
    async updateSuggestedTemplatesPageHandler(newPage) {
      await this.updateMatchedTemplatesPage(newPage);
    },
    async updateSuggestedLinksPageHandler(newPage) {
      await this.updatematchedLinksPage(newPage);
    },
    async updateSuggestedCaseStudiesPageHandler(newPage) {
      await this.updateMatchedCaseStudiesPage(newPage);
    },
    async updateIndustriesHandler(newIndustries) {
      await this.updateIndustries(newIndustries);
    },
    async updateTheLoading(loading) {
      await this.updateLoading(loading);
    },
    // update selected tags handler
    updateSelectedTagsHandler(newSelectedProjects) {
      this.updateSelectedTags(newSelectedProjects);
    },

    // update tags with new page
    async updateAllTagsPageHandler(newPage) {
      await this.updateAllTagsPage(newPage);
    },

    //update suggested tags with new page
    async updateSuggestedTagsPageHandler(newPage) {
      await this.updateSuggestedTagsPage(newPage);
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
          // if the user is actually on the page that loads after the submission of upwork proposal then in that case addButton prop will be true
          const { defaultTab } = await getDefaultTab();
          const bidDailyCount = await chrome.storage.sync.get([STORAGE.BID_DAILY_COUNT]);
          const linkedinConnectDailyCount = await chrome.storage.sync.get([
            STORAGE.LINKEDIN_CONNECT_DAILY_COUNT,
          ]);
          if (defaultTab === TABS.UPWORK) {
            handleRuntimeMessage({
              message: MESSAGES.UPDATE_BADGE,
              count: bidDailyCount.bidDailyCount,
            });
          } else if (defaultTab === TABS.LINKEDIN) {
            handleRuntimeMessage({
              message: MESSAGES.UPDATE_BADGE,
              count: linkedinConnectDailyCount.linkedinConnectDailyCount,
            });
          }
          handleRuntimeMessage({
            message: this.linkedinPage
              ? MESSAGES.UPDATE_LINKEDIN_PROFILE
              : MESSAGES.UPDATE_UPWORK_PROFILE,
          });
          if (this.addButton || this.linkedinPage) {
            handleRuntimeMessage({
              message: MESSAGES.ADD_BUTTONS,
            });
            this.$emit("directToTheLogoutScreen");
          }

          this.$emit("signedIn");
          this.signInLoading = false;
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

    handleToggleOpenTags(childComponentName) {
      // Toggle the clicked component
      this.showOpenTags[childComponentName] = !this.showOpenTags[childComponentName];
    },

    closeSearchBox() {
      this.searchBox = false;
    },

    async updatePortfoliosAndTemplate() {
      // update all the page numbers with 1 because when we remove or add a tag in selectedTags list, it fetches the corresponding portfolios and template for the first page, so we must update the page to 1 as well to avoid any unexpected behavior
      this.updateSuggestedProjectsPageHandler(1);
      this.updateSuggestedTemplatesPageHandler(1);
      this.updateSuggestedLinksPageHandler(1);
      this.updateSuggestedCaseStudiesPageHandler(1);
      await this.$store.dispatch("projects/fetchMatchedProjects");
      await this.$store.dispatch("templates/fetchMatchedTemplates");
      await this.$store.dispatch("links/fetchmatchedLinks");
      await this.$store.dispatch("caseStudies/fetchMatchedCaseStudies");
    },

    async selectDeselectTheTags(tag) {
      if (!this.selectedTags.includes(tag)) {
        this.selectedTags.push(tag);
      } else {
        if (this.selectedTags.length > 0) {
          this.selectedTags = this.selectedTags.filter(
            (selectedTag) => selectedTag !== tag
          );
        }
      }
      // call update selected tags handler
      await this.updateSelectedTagsHandler(this.selectedTags);
      this.updateTheLoading(true);
      await this.updatePortfoliosAndTemplate();
      this.updateTheLoading(false);
    },

    async removeTheTag(tag) {
      if (this.selectedTags.length > 0) {
        this.selectedTags = this.selectedTags.filter(
          (selectedTag) => selectedTag !== tag
        );
      }
      // call update selected tags handler
      await this.updateSelectedTagsHandler(this.selectedTags);
      this.updateTheLoading(true);
      await this.updatePortfoliosAndTemplate();
      this.updateTheLoading(false);
    },

    debouncedSearch: debounce(function (query) {
      this.fetchTags(query);
    }, 300),

    async fetchTags(query) {
      this.loadingSearch = true;
      try {
        // if noTagsMatched is already set to true, make it false
        this.noTagsMatched = false;
        const { tags } = await getTags([], 1, query);
        if (tags) {
          if (tags.length === 0) {
            this.noTagsMatched = true;
          } else {
            this.searchResult = tags;
          }
        } else {
          throw new Error("Failed to fetch tags");
        }
      } catch {
        // Intentionally left blank
      } finally {
        this.loadingSearch = false;
      }
    },

    onChangeSearch(e) {
      const query = e.target.value;
      this.search = query;
      if (query.trim().length >= 3) {
        this.searchBox = true;
        this.debouncedSearch(query);
      }
    },

    async handleTagClick(tag) {
      const tagName = tag?.name;
      if (!this.selectedTags.includes(tagName)) {
        this.selectedTags.push(tagName);
      }
      // open selected tags div
      if (!this.showOpenTags["SelectedTags"]) {
        this.handleToggleOpenTags("SelectedTags");
      }
      this.searchBox = false;
      // call update selected tags handler
      this.updateSelectedTagsHandler(this.selectedTags);
      this.updatePortfoliosAndTemplate();
    },

    async loadNextSuggestedTags() {
      if (
        this.tagsCount !== 0 &&
        this.suggestedTagsPage < this.tagsCount / this.tagsPerPage
      ) {
        this.suggestedTagsPage = this.suggestedTagsPage + 1;
        this.updateSuggestedTagsPageHandler(this.suggestedTagsPage);
        await this.$store.dispatch("tags/fetchSuggestedTags", this.suggestedTagsPage);
        const computedSuggestedTags = this.$store.state.tags.suggestedTags;
        this.suggestedTags = computedSuggestedTags?.map((tag) => tag.name);
      }
    },

    async loadPrevSuggestedTags() {
      if (this.suggestedTagsPage > 1) {
        this.suggestedTagsPage = this.suggestedTagsPage - 1;
        this.updateSuggestedTagsPageHandler(this.suggestedTagsPage);
        await this.$store.dispatch("tags/fetchSuggestedTags", this.suggestedTagsPage);
        const computedSuggestedTags = this.$store.state.tags.suggestedTags;
        this.suggestedTags = computedSuggestedTags?.map((tag) => tag.name);
      }
    },
    triggerSignIn() {
      this.$refs.signInButton.$el.click();
    },
    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible;
    },
  },

  async mounted() {
    this.isComponentLoaded = true;
    if (
      PATTERNS.UPWORK.test(window.location.href) ||
      PATTERNS.PROPOSAL_DETAILS.test(window.location.href)
    ) {
      this.otherPage = true;
      if (PATTERNS.SUBMIT_PROPOSAL.test(window.location.href)) {
        this.otherPage = false;
      }
    }
    if (!this.linkedinPage && !this.otherPage) {
      this.loading = true;
      await this.$store.dispatch("tags/fetchSuggestedTags");
      const computedTags = this.$store.state.tags.suggestedTags;
      this.suggestedTags =
        computedTags && computedTags?.length ? computedTags?.map((tag) => tag.name) : [];
      this.tagsCount = this.$store.state.tags.tagsCount;
      this.tagsPerPage = this.$store.state.tags.tagsPerPage;
      this.selectedTags = this.$store.state.tags.selectedTags;
      this.suggestedTagsPage = this.$store.state.tags.suggestedTagsPage;
      this.loading = false;
    }
  },
};
</script>

<style>
[v-cloak] {
  display: none;
}

@import "../assets/styles/extensionMenu.css";
</style>
@/utility/parserHelper
