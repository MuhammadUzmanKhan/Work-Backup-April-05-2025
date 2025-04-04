<template>
  <div class="rs-extension-detail-head">
    <span><strong>Case Studies</strong> - attach case studies for your bid</span>
  </div>
  <div class="rs-extension-detail-body" style="position: relative">
    <Search
      :search="search"
      :noMatched="noCaseStudyMatched"
      :item="'Case Study'"
      :searchResult="searchResult"
      :searchBox="searchBox"
      :loading="searchLoading"
      @onTheChangeSearch="setSearchInput($event)"
      @handleClicked="handleCaseStudyClicked($event)"
      @closeTheSearch="closeSearchBox"
    />
    <ExplorePortfolios
      @toggleTheOpenPortfolios="handleToggleOpenCaseStudies('SuggestedCaseStudies')"
      :showOpenPortfolios="showOpenCaseStudies.SuggestedCaseStudies"
      :componentName="'SuggestedCaseStudies'"
      :title="'Suggested CaseStudies based on the Job Proposal'"
      :noPortfolios="'No Matching CaseStudies found!'"
      :suggestedPortfolios="suggestedCaseStudies"
      :loading="loading"
      :checkedLabel="checkedLabel"
      :suggestedPortfoliosCount="suggestedCaseStudiesCount"
      :suggestedPortfoliosPage="suggestedCaseStudiesPage"
      :portfoliosTableHeadings="CaseStudiesTableHeadings"
      :type="'Case Study'"
      :portfoliosPerPage="CaseStudiesPerPage"
      @clickOnLabelChecked="clickLabelChecked($event)"
      @loadThePrevSuggestedPortfolios="loadPrevSuggestedCaseStudies"
      @loadTheNextSuggestedPortfolios="loadNextSuggestedCaseStudies"
      @openThePreview="openPreview($event)"
    />
    <ExplorePortfolios
      @toggleTheOpenPortfolios="handleToggleOpenCaseStudies('SelectedCaseStudies')"
      :showOpenPortfolios="showOpenCaseStudies.SelectedCaseStudies"
      :componentName="'SelectedCaseStudies'"
      :title="'Selected CaseStudies'"
      :noPortfolios="'No CaseStudies selected!'"
      :loading="false"
      :selectedPortfolios="selectedCaseStudies"
      :checkedLabel="checkedLabel"
      :portfoliosTableHeadings="CaseStudiesTableHeadings"
      :type="'Case Study'"
      @clickOnLabelCheckedSelectedPortfolios="
        clickLabelCheckedSelectedCaseStudies($event)
      "
      @openThePreview="openPreview($event)"
    />
  </div>
  <div v-if="previewOpen">
    <Preview
      :portfolio="openCaseStudy"
      @closeThePreview="closePreview"
      :selectedPortfolios="selectedCaseStudies"
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
  name: "CaseStudiesSection",
  components: { ExplorePortfolios, Search, Preview, "a-button": Button },
  emits: ["goToNext", "goToBack"],
  data() {
    return {
      showOpenCaseStudies: {
        SuggestedCaseStudies: true,
        SelectedCaseStudies: true,
      },
      CaseStudiesTableHeadings: {
        CaseStudies: "CaseStudies",
        tags: "Tags",
      },
      suggestedCaseStudies: [],
      selectedCaseStudies: [],
      selectedCaseStudiesGlobal: [],
      loading: false,
      searchLoading: false,
      noCaseStudyMatched: false,
      search: "",
      searchBox: false,
      searchResult: [],
      checkedLabel: [],
      CaseStudiesPerPage: 0,
      suggestedCaseStudiesCount: 0,
      suggestedCaseStudiesPage: 1,
      previewOpen: false,
      openCaseStudy: {},
    };
  },
  methods: {
    ...mapActions("caseStudies", [
      "updateSelectedCaseStudies",
      "updateCheckedLabel",
      "updateMatchedCaseStudiesPage",
    ]),

    handleToggleOpenCaseStudies(childComponentName) {
      // Toggle the clicked component
      this.showOpenCaseStudies[childComponentName] = !this.showOpenCaseStudies[
        childComponentName
      ];
    },
    updateSelectedCaseStudiesHandler(newSelectedCaseStudies) {
      this.updateSelectedCaseStudies(newSelectedCaseStudies);
    },
    updateCheckedLabelHandler(newCheckedLabel) {
      this.updateCheckedLabel(newCheckedLabel);
    },
    closeSearchBox() {
      this.searchBox = false;
    },
    openPreview(portfolio) {
      this.previewOpen = true;
      const matchingCaseStudy = this.selectedCaseStudies.find(
        (caseStudy) => caseStudy.name === portfolio.name
      );

      if (matchingCaseStudy) {
        // Portfolio exists in selectedCaseStudies, update it
        this.openCaseStudy = matchingCaseStudy;
      } else {
        this.openCaseStudy = portfolio;
      }
    },
    closePreview() {
      this.previewOpen = false;
    },
    // update suggested CaseStudies with new page
    async updateSuggestedCaseStudiesPageHandler(newPage) {
      await this.updateMatchedCaseStudiesPage(newPage);
    },
    pushCaseStudy(caseStudy) {
      // create another property with every link, which is checked initially set to true, it will help us show the links in that Case study's preview
      caseStudy.links.forEach((link) => (link.checked = true));
      this.selectedCaseStudies.push(caseStudy);
    },
    removeCaseStudy(caseStudy) {
      if (this.selectedCaseStudies.length > 0) {
        this.selectedCaseStudies = this.selectedCaseStudies.filter(
          (selectedCaseStudies) => selectedCaseStudies.name !== caseStudy.name
        );
      }
    },
    pushSelectedCaseStudies(caseStudy) {
      // don't push the Case study in the this.selectedCaseStudies, so that it does not show in the UI, this code will only update the state of selectedCaseStudies in vuex
      this.selectedCaseStudiesGlobal.push(caseStudy);
      this.updateSelectedCaseStudiesHandler(this.selectedCaseStudiesGlobal);
    },
    removeSelectedCaseStudies(caseStudy) {
      // don't remove the case study from the this.selectedCaseStudies, so that it does not show in the UI, this code will only update the state of selectedCaseStudies in vuex
      if (this.selectedCaseStudiesGlobal.length > 0) {
        this.selectedCaseStudiesGlobal = this.selectedCaseStudiesGlobal.filter(
          (selectedCaseStudy) => selectedCaseStudy.name !== caseStudy.name
        );
        this.updateSelectedCaseStudiesHandler(this.selectedCaseStudiesGlobal);
      }
    },
    clickLabelChecked(caseStudy) {
      if (this.checkedLabel.includes(caseStudy.name)) {
        this.checkedLabel = this.checkedLabel.filter((item) => item !== caseStudy.name);
        this.removeCaseStudy(caseStudy);
      } else {
        this.checkedLabel.push(caseStudy.name);
        if (!this.selectedCaseStudies.includes(caseStudy)) {
          this.pushCaseStudy(caseStudy);
        }
      }
      // call update methods for updating state of selectedCaseStudies and checkedLabel
      this.updateSelectedCaseStudiesHandler(this.selectedCaseStudies);
      this.updateCheckedLabelHandler(this.checkedLabel);
    },
    clickLabelCheckedSelectedCaseStudies(caseStudy) {
      if (this.checkedLabel.includes(caseStudy.name)) {
        this.checkedLabel = this.checkedLabel.filter((item) => item !== caseStudy.name);
        this.removeSelectedCaseStudy(caseStudy);
      } else {
        this.checkedLabel.push(caseStudy.name);
        this.pushSelectedCaseStudy(caseStudy);
      }
      // call update methods for updating state of checkedLabel
      this.updateCheckedLabelHandler(this.checkedLabel);
    },
    handleCaseStudyClicked(caseStudy) {
      // push the case study in selected CaseStudies and also check the label
      if (!this.checkedLabel.includes(caseStudy.name)) {
        this.checkedLabel.push(caseStudy.name);
        if (!this.selectedCaseStudies.includes(caseStudy)) {
          this.pushCaseStudy(caseStudy);
        }
      }
      //close the search box
      this.searchBox = false;
    },
    debouncedSearch: debounce(function (query) {
      this.fetchAllCaseStudies(query);
    }, 300),

    async fetchAllCaseStudies(query) {
      this.searchLoading = true;
      try {
        this.noCaseStudyMatched = false;
        const { portfolios } = await getPortfolios(PORTFOLIO_TYPE.CASE_STUDY, 1, query);
        if (portfolios) {
          if (portfolios.length === 0) {
            this.noCaseStudyMatched = true;
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

    async loadNextSuggestedCaseStudies() {
      if (
        this.suggestedCaseStudiesCount !== 0 &&
        this.suggestedCaseStudiesPage <
          this.suggestedCaseStudiesCount / this.CaseStudiesPerPage
      ) {
        this.suggestedCaseStudiesPage = this.suggestedCaseStudiesPage + 1;
        this.updateSuggestedCaseStudiesPageHandler(this.suggestedCaseStudiesPage);
        await this.$store.dispatch(
          "caseStudies/fetchMatchedCaseStudies",
          this.suggestedCaseStudiesPage
        );
        this.suggestedCaseStudies = this.$store.state.caseStudies.matchedCaseStudies;
      }
    },

    async loadPrevSuggestedCaseStudies() {
      if (this.suggestedCaseStudiesPage > 1) {
        this.suggestedCaseStudiesPage = this.suggestedCaseStudiesPage - 1;
        this.updateSuggestedCaseStudiesPageHandler(this.suggestedCaseStudiesPage);
        await this.$store.dispatch(
          "caseStudies/fetchMatchedCaseStudies",
          this.suggestedCaseStudiesPage
        );
        this.suggestedCaseStudies = this.$store.state.caseStudies.matchedCaseStudies;
      }
    },

    linkClicked(caseStudy) {
      this.selectedCaseStudies?.map((selectedCaseStudy) => {
        if (selectedCaseStudy.id === caseStudy.id) {
          return caseStudy; // Replace with the updated object
        }
        return selectedCaseStudy; // Keep the original object if it's not the one to be updated
      });
      this.updateSelectedCaseStudiesHandler(this.selectedCaseStudies);
    },
    goNext() {
      this.$emit("goToNext");
    },
    goBack() {
      this.$emit("goToBack");
    },
  },
  watch: {
    "$store.state.caseStudies.matchedCaseStudies"(newValue) {
      this.suggestedCaseStudies = newValue;
    },
    "$store.state.caseStudies.matchedCaseStudiesPerPage"(newValue) {
      this.CaseStudiesPerPage = newValue;
    },
    "$store.state.caseStudies.matchedCaseStudiesCount"(newValue) {
      this.suggestedCaseStudiesCount = newValue;
    },
    "$store.state.caseStudies.matchedCaseStudiesPage"(newValue) {
      this.suggestedCaseStudiesPage = newValue;
    },
  },
  async mounted() {
    this.loading = true;
    this.suggestedCaseStudies = this.$store.state.caseStudies.matchedCaseStudies;
    this.selectedCaseStudies = this.$store.state.caseStudies.selectedCaseStudies;
    this.selectedCaseStudiesGlobal = this.$store.state.caseStudies.selectedCaseStudies;
    this.checkedLabel = this.$store.state.caseStudies.checkedLabel;
    this.CaseStudiesPerPage = this.$store.state.caseStudies.matchedCaseStudiesPerPage;
    this.suggestedCaseStudiesCount = this.$store.state.caseStudies.matchedCaseStudiesCount;
    this.suggestedCaseStudiesPage = this.$store.state.caseStudies.matchedCaseStudiesPage;
    this.loading = false;
  },
};
</script>
