<template>
  <div class="rs-extension-detail-head">
    <span><strong>Templates</strong> - set template for your bid</span>
  </div>
  <div class="rs-extension-detail-body" style="position: relative">
    <Search
      :search="search"
      :noMatched="noTemplateMatched"
      :item="'Template'"
      :searchResult="searchResult"
      :searchBox="searchBox"
      :loading="searchLoading"
      @onTheChangeSearch="setSearchInput($event)"
      @handleClicked="handleTemplateClicked($event)"
      @closeTheSearch="closeSearchBox"
    />
    <ExplorePortfolios
      @toggleTheOpenPortfolios="handleToggleOpenTemplates('SuggestedTemplates')"
      :showOpenPortfolios="showOpenTemplates.SuggestedTemplates"
      :componentName="'SuggestedTemplates'"
      :title="'Suggested Templates based on the Job Proposal'"
      :noPortfolios="'No Matching template found!'"
      :suggestedPortfolios="suggestedTemplates"
      :loading="loading"
      :checkedLabel="checkedLabel"
      :suggestedPortfoliosCount="suggestedTemplatesCount"
      :suggestedPortfoliosPage="suggestedTemplatesPage"
      :portfoliosTableHeadings="templatesTableHeadings"
      :type="'Template'"
      :portfoliosPerPage="templatesPerPage"
      @clickOnLabelChecked="clickLabelChecked($event)"
      @loadThePrevSuggestedPortfolios="loadPrevSuggestedTemplates"
      @loadTheNextSuggestedPortfolios="loadNextSuggestedTemplates"
      @openThePreview="openPreview($event)"
    />
    <ExplorePortfolios
      @toggleTheOpenPortfolios="handleToggleOpenTemplates('SelectedTemplate')"
      :showOpenPortfolios="showOpenTemplates.SelectedTemplate"
      :componentName="'SelectedTemplate'"
      :title="'Selected Template'"
      :noPortfolios="'No template selected!'"
      :loading="false"
      :selectedPortfolios="selectedTemplate"
      :checkedLabel="checkedLabel"
      :portfoliosTableHeadings="templatesTableHeadings"
      :type="'Template'"
      @clickOnLabelCheckedSelectedPortfolios="clickLabelCheckedSelectedTemplate($event)"
      @openThePreview="openPreview($event)"
    />
  </div>
  <div v-if="previewOpen">
    <Preview
      :portfolio="openTemplate"
      @closeThePreview="closePreview"
      :selectedPortfolios="selectedTemplate"
      @onClickLink="linkClicked($event)"
    />
  </div>
  <div class="rs-next-back-buttons-container">
    <a-button class="rs-back-portfolios-btn rs-next-back-disabled" disabled
      >Back</a-button
    >
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
  name: "ProjectsSection",
  components: { ExplorePortfolios, Search, Preview, "a-button": Button },
  emits: ["goToNext"],
  data() {
    return {
      showOpenTemplates: {
        SuggestedTemplates: true,
        SelectedTemplate: true,
      },
      templatesTableHeadings: {
        projects: "Templates",
        tags: "Tags",
      },
      suggestedTemplates: [],
      selectedTemplate: [],
      selectedTemplateGlobal: [],
      loading: false,
      searchLoading: false,
      noTemplateMatched: false,
      search: "",
      searchBox: false,
      searchResult: [],
      checkedLabel: [],
      templatesPerPage: 0,
      suggestedTemplatesCount: 0,
      suggestedTemplatesPage: 1,
      previewOpen: false,
      openTemplate: {},
    };
  },
  methods: {
    ...mapActions("templates", [
      "updateSelectedTemplate",
      "updateCheckedLabel",
      "updateMatchedTemplatesPage",
    ]),

    handleToggleOpenTemplates(childComponentName) {
      // Toggle the clicked component
      this.showOpenTemplates[childComponentName] = !this.showOpenTemplates[
        childComponentName
      ];
    },
    updateSelectedTemplateHandler(newSelectedTemplate) {
      this.updateSelectedTemplate(newSelectedTemplate);
    },
    updateCheckedLabelHandler(newCheckedLabel) {
      this.updateCheckedLabel(newCheckedLabel);
    },
    closeSearchBox() {
      this.searchBox = false;
    },
    openPreview(portfolio) {
      this.previewOpen = true;
      this.openTemplate = portfolio;
    },
    closePreview() {
      this.previewOpen = false;
    },
    // update suggested template with new page
    async updateSuggestedTemplatesPageHandler(newPage) {
      await this.updateMatchedTemplatesPage(newPage);
    },
    clickLabelChecked(template) {
      const isSelected = this.selectedTemplate.some(
        (selected) => selected.id === template.id
      );

      // Clear both arrays
      this.checkedLabel = [];
      this.selectedTemplate = [];

      // If the clicked template is not already selected, update the selection
      if (!isSelected) {
        this.checkedLabel.push(template.name);
        this.selectedTemplate.push(template);
      }
      // call update methods for updating state of selectedTemplate and checkedLabel
      this.updateSelectedTemplateHandler(this.selectedTemplate);
      this.updateCheckedLabelHandler(this.checkedLabel);
    },
    clickLabelCheckedSelectedTemplate(template) {
      if (this.checkedLabel.length > 0) {
        this.checkedLabel = [];
      } else {
        this.checkedLabel.push(template.name);
      }
      if (this.selectedTemplateGlobal.length > 0) {
        this.selectedTemplateGlobal = [];
      } else {
        this.selectedTemplateGlobal.push(template);
      }
      // call update methods for updating state of checkedLabel
      this.updateCheckedLabelHandler(this.checkedLabel);
      this.updateSelectedTemplateHandler(this.selectedTemplateGlobal);
    },
    handleTemplateClicked(template) {
      const isSelected = this.selectedTemplate.some(
        (selected) => selected.id === template.id
      );
      // If the clicked template is not already selected, update the selection
      if (!isSelected) {
        // Clear both arrays
        this.checkedLabel = [];
        this.selectedTemplate = [];
        this.checkedLabel.push(template.name);
        this.selectedTemplate.push(template);
        this.updateCheckedLabelHandler(this.checkedLabel);
        this.updateSelectedTemplateHandler(this.selectedTemplate);
      }
      //close the search box
      this.searchBox = false;
    },
    debouncedSearch: debounce(function (query) {
      this.fetchAllTemplates(query);
    }, 300),

    async fetchAllTemplates(query) {
      this.searchLoading = true;
      try {
        this.noTemplateMatched = false;
        const { portfolios } = await getPortfolios(PORTFOLIO_TYPE.TEMPLATE, 1, query);
        if (portfolios) {
          if (portfolios.length === 0) {
            this.noTemplateMatched = true;
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

    async loadNextSuggestedTemplates() {
      if (
        this.suggestedTemplatesCount !== 0 &&
        this.suggestedTemplatesPage < this.suggestedTemplatesCount / this.templatesPerPage
      ) {
        this.suggestedTemplatesPage = this.suggestedTemplatesPage + 1;
        this.updateSuggestedTemplatesPageHandler(this.suggestedTemplatesPage);
        await this.$store.dispatch(
          "templates/fetchMatchedTemplates",
          this.suggestedTemplatesPage
        );
        this.suggestedTemplates = this.$store.state.templates.matchedTemplates;
      }
    },

    async loadPrevSuggestedTemplates() {
      if (this.suggestedTemplatesPage > 1) {
        this.suggestedTemplatesPage = this.suggestedTemplatesPage - 1;
        this.updateSuggestedTemplatesPageHandler(this.suggestedTemplatesPage);
        await this.$store.dispatch(
          "templates/fetchMatchedTemplates",
          this.suggestedTemplatesPage
        );
        this.suggestedTemplates = this.$store.state.templates.matchedTemplates;
      }
    },

    linkClicked(template) {
      this.selectedTemplate?.map((selectedTemplate) => {
        if (selectedTemplate.id === template.id) {
          return template; // Replace with the updated object
        }
        return selectedTemplate; // Keep the original object if it's not the one to be updated
      });
      this.updateSelectedTemplateHandler(this.selectedTemplate);
    },
    goNext() {
      this.$emit("goToNext");
    },
  },
  watch: {
    "$store.state.templates.matchedTemplates"(newValue) {
      this.suggestedTemplates = newValue;
    },
    "$store.state.templates.matchedTemplatesPerPage"(newValue) {
      this.templatesPerPage = newValue;
    },
    "$store.state.templates.matchedTemplatesCount"(newValue) {
      this.suggestedTemplatesCount = newValue;
    },
    "$store.state.templates.matchedTemplatesPage"(newValue) {
      this.suggestedTemplatesPage = newValue;
    },
  },
  async mounted() {
    this.loading = true;
    this.suggestedTemplates = this.$store.state.templates.matchedTemplates;
    this.selectedTemplate = this.$store.state.templates.selectedTemplate;
    this.selectedTemplateGlobal = this.$store.state.templates.selectedTemplate;
    this.checkedLabel = this.$store.state.templates.checkedLabel;
    this.templatesPerPage = this.$store.state.templates.matchedTemplatesPerPage;
    this.suggestedTemplatesCount = this.$store.state.templates.matchedTemplatesCount;
    this.suggestedTemplatesPage = this.$store.state.templates.matchedTemplatesPage;
    this.loading = false;
  },
};
</script>

<style></style>
