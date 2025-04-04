<template>
  <div class="rs-extension-detail-head">
    <span><strong>Links</strong> - attach links for your bid</span>
  </div>
  <div class="rs-extension-detail-body" style="position: relative">
    <Search
      :search="search"
      :noMatched="noLinkMatched"
      :item="'Link'"
      :searchResult="searchResult"
      :searchBox="searchBox"
      :loading="searchLoading"
      @onTheChangeSearch="setSearchInput($event)"
      @handleClicked="handleLinkClicked($event)"
      @closeTheSearch="closeSearchBox"
    />

    <ExplorePortfolios
      @toggleTheOpenPortfolios="handleToggleOpenlinks('SuggestedLinks')"
      :showOpenPortfolios="showOpenlinks.SuggestedLinks"
      :componentName="'SuggestedLinks'"
      :title="'Suggested Links based on the Job Proposal'"
      :noPortfolios="'No Matching Link found!'"
      :suggestedPortfolios="suggestedLinks"
      :loading="loading"
      :checkedLabel="checkedLabel"
      :suggestedPortfoliosCount="suggestedLinksCount"
      :suggestedPortfoliosPage="suggestedLinksPage"
      :portfoliosTableHeadings="linksTableHeadings"
      :type="'Link'"
      :portfoliosPerPage="linksPerPage"
      @clickOnLabelChecked="clickLabelChecked($event)"
      @loadThePrevSuggestedPortfolios="loadPrevSuggestedLinks"
      @loadTheNextSuggestedPortfolios="loadNextSuggestedLinks"
      @openThePreview="openPreview($event)"
    />
    <ExplorePortfolios
      @toggleTheOpenPortfolios="handleToggleOpenlinks('selectedLinks')"
      :showOpenPortfolios="showOpenlinks.selectedLinks"
      :componentName="'selectedLinks'"
      :title="'Selected Links'"
      :noPortfolios="'No Link selected!'"
      :loading="false"
      :selectedPortfolios="selectedLinks"
      :checkedLabel="checkedLabel"
      :portfoliosTableHeadings="linksTableHeadings"
      :type="'Link'"
      @clickOnLabelCheckedSelectedPortfolios="clickLabelCheckedselectedLinks($event)"
      @openThePreview="openPreview($event)"
    />
  </div>
  <div v-if="previewOpen">
    <Preview
      :portfolio="openLink"
      @closeThePreview="closePreview"
      :selectedPortfolios="selectedLinks"
      @onClickLink="linkClicked($event)"
    />
  </div>
  <div class="rs-next-back-buttons-container">
    <a-button @click="goBack" class="rs-back-portfolios-btn">Back</a-button>
    <a-button @click="goNext" class="rs-next-portfolios-btn">Next</a-button>
  </div>
</template>

<script>
import { debounce } from "@/utility/debounce";
import ExplorePortfolios from "./ExplorePortfolios.vue";
import { getPortfolios } from "@/provider";
import { PORTFOLIO_TYPE } from "../utility/portfolioType";
import { mapActions } from "vuex";
import Search from "./Search.vue";
import Preview from "./Preview.vue";
import { Button } from "ant-design-vue";

export default {
  name: "LinksSection",
  components: { ExplorePortfolios, Search, Preview, "a-button": Button },
  emits: ["goToBack", "goToNext"],
  data() {
    return {
      linksArray: [{ codeSnippets: "Code Snippets" }, { links: "Links" }],
      selected: {
        codeSnippets: false,
        links: true,
      },
      showOpenlinks: {
        SuggestedLinks: true,
        selectedLinks: true,
      },
      linksTableHeadings: {
        links: "Links",
        tags: "Tags",
      },
      suggestedLinks: [],
      selectedLinks: [],
      selectedLinksGlobal: [],
      loading: false,
      searchLoading: false,
      noLinkMatched: false,
      search: "",
      searchBox: false,
      searchResult: [],
      checkedLabel: [],
      linksPerPage: 0,
      suggestedLinksCount: 0,
      suggestedLinksPage: 1,
      previewOpen: false,
      openLink: {},
    };
  },
  methods: {
    ...mapActions("links", [
      "updateselectedLinks",
      "updateCheckedLabel",
      "updatematchedLinksPage",
    ]),

    clicked(key) {
      if (key === "codeSnippets") {
        this.selected.codeSnippets = true;
        this.selected.links = false;
      } else if (key === "links") {
        this.selected.links = true;
        this.selected.codeSnippets = false;
      }
    },
    handleToggleOpenlinks(childComponentName) {
      // Toggle the clicked component
      this.showOpenlinks[childComponentName] = !this.showOpenlinks[childComponentName];
    },
    updateselectedLinksHandler(newselectedLinks) {
      this.updateselectedLinks(newselectedLinks);
    },
    updateCheckedLabelHandler(newCheckedLabel) {
      this.updateCheckedLabel(newCheckedLabel);
    },
    closeSearchBox() {
      this.searchBox = false;
    },
    openPreview(portfolio) {
      this.previewOpen = true;
      const matchingLink = this.selectedLinks.find(
        (link) => link.name === portfolio.name
      );

      if (matchingLink) {
        // Portfolio exists in selectedLinks, update it
        this.openLink = matchingLink;
      } else {
        this.openLink = portfolio;
      }
    },
    closePreview() {
      this.previewOpen = false;
    },
    // update suggested Links with new page
    async updateSuggestedLinksPageHandler(newPage) {
      await this.updatematchedLinksPage(newPage);
    },
    pushLink(link) {
      // create another property with every link, which is checked initially set to true, it will help us show the links in that project's preview
      link.links.forEach((link) => (link.checked = true));
      this.selectedLinks.push(link);
    },
    removeLink(link) {
      if (this.selectedLinks.length > 0) {
        this.selectedLinks = this.selectedLinks.filter(
          (selectedLink) => selectedLink.name !== link.name
        );
      }
    },
    pushSelectedLink(link) {
      // don't push the project in the this.selectedLinks, so that it does not show in the UI, this code will only update the state of selectedLinks in vuex
      this.selectedLinksGlobal.push(link);
      this.updateselectedLinksHandler(this.selectedLinksGlobal);
    },
    removeSelectedLink(link) {
      // don't remove the project from the this.selectedLinks, so that it does not show in the UI, this code will only update the state of selectedLinks in vuex
      if (this.selectedLinksGlobal.length > 0) {
        this.selectedLinksGlobal = this.selectedLinksGlobal.filter(
          (selectedlink) => selectedlink.name !== link.name
        );
        this.updateselectedLinksHandler(this.selectedLinksGlobal);
      }
    },
    clickLabelChecked(link) {
      if (this.checkedLabel.includes(link.name)) {
        this.checkedLabel = this.checkedLabel.filter((item) => item !== link.name);
        this.removeLink(link);
      } else {
        this.checkedLabel.push(link.name);
        if (!this.selectedLinks.includes(link)) {
          this.pushLink(link);
        }
      }
      // call update methods for updating state of selectedLinks and checkedLabel
      this.updateselectedLinksHandler(this.selectedLinks);
      this.updateCheckedLabelHandler(this.checkedLabel);
    },
    clickLabelCheckedselectedLinks(link) {
      if (this.checkedLabel.includes(link.name)) {
        this.checkedLabel = this.checkedLabel.filter((item) => item !== link.name);
        this.removeSelectedLink(link);
      } else {
        this.checkedLabel.push(link.name);
        this.pushSelectedLink(link);
      }
      // call update methods for updating state of checkedLabel
      this.updateCheckedLabelHandler(this.checkedLabel);
    },
    handleLinkClicked(link) {
      // push the project in selected Links and also check the label
      if (!this.checkedLabel.includes(link.name)) {
        this.checkedLabel.push(link.name);
        if (!this.selectedLinks.includes(link)) {
          this.pushLink(link);
        }
      }
      //close the search box
      this.searchBox = false;
    },
    debouncedSearch: debounce(function (query) {
      this.fetchAllLinks(query);
    }, 300),

    async fetchAllLinks(query) {
      this.searchLoading = true;
      try {
        this.noLinkMatched = false;
        const { portfolios } = await getPortfolios(PORTFOLIO_TYPE.LINK, 1, query);
        if (portfolios) {
          if (portfolios.length === 0) {
            this.noLinkMatched = true;
          } else {
            this.searchResult = portfolios;
          }
        } else {
          throw new Error("Failed to fetch portfolios");
        }
      } catch {
        // Intentionally left blank
      } finally {
        this.searchLoading = false;
      }
    },

    setSearchInput(event) {
      const query = event.target.value;
      this.search = query;
      if (query.trim().length >= 3) {
        this.searchBox = true;
        this.debouncedSearch(query);
      }
    },

    async loadNextSuggestedLinks() {
      if (
        this.suggestedLinksCount !== 0 &&
        this.suggestedLinksPage < this.suggestedLinksCount / this.linksPerPage
      ) {
        this.suggestedLinksPage = this.suggestedLinksPage + 1;
        this.updateSuggestedLinksPageHandler(this.suggestedLinksPage);
        await this.$store.dispatch("links/fetchmatchedLinks", this.suggestedLinksPage);
        this.suggestedLinks = this.$store.state.links.matchedLinks;
      }
    },

    async loadPrevSuggestedLinks() {
      if (this.suggestedLinksPage > 1) {
        this.suggestedLinksPage = this.suggestedLinksPage - 1;
        this.updateSuggestedLinksPageHandler(this.suggestedLinksPage);
        await this.$store.dispatch("links/fetchmatchedLinks", this.suggestedLinksPage);
        this.suggestedLinks = this.$store.state.links.matchedLinks;
      }
    },

    linkClicked(link) {
      this.selectedLinks?.map((selectedLink) => {
        if (selectedLink.id === link.id) {
          return link; // Replace with the updated object
        }
        return selectedLink; // Keep the original object if it's not the one to be updated
      });
      this.updateselectedLinksHandler(this.selectedLinks);
    },

    goBack() {
      this.$emit("goToBack");
    },
    goNext() {
      this.$emit("goToNext");
    },
  },
  watch: {
    "$store.state.links.matchedLinks"(newValue) {
      this.suggestedLinks = newValue;
    },
    "$store.state.links.matchedLinksPerPage"(newValue) {
      this.linksPerPage = newValue;
    },
    "$store.state.links.matchedLinksCount"(newValue) {
      this.suggestedLinksCount = newValue;
    },
    "$store.state.links.matchedLinksPage"(newValue) {
      this.suggestedLinksPage = newValue;
    },
  },
  async mounted() {
    this.loading = true;
    this.suggestedLinks = this.$store.state.links.matchedLinks;
    this.selectedLinks = this.$store.state.links.selectedLinks;
    this.selectedLinksGlobal = this.$store.state.links.selectedLinks;
    this.checkedLabel = this.$store.state.links.checkedLabel;
    this.linksPerPage = this.$store.state.links.matchedLinksPerPage;
    this.suggestedLinksCount = this.$store.state.links.matchedLinksCount;
    this.suggestedLinksPage = this.$store.state.links.matchedLinksPage;
    this.loading = false;
  },
};
</script>

<style>
.rs-link {
  color: white !important;
  text-decoration: none;
}
</style>
