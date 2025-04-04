<template>
  <div class="rs-extension-detail-head">
    <span><strong>Projects</strong> - attach projects for your bid</span>
  </div>
  <div class="rs-extension-detail-body" style="position: relative">
    <Search
      :search="search"
      :noMatched="noProjectMatched"
      :item="'Project'"
      :searchResult="searchResult"
      :searchBox="searchBox"
      :loading="searchLoading"
      @onTheChangeSearch="setSearchInput($event)"
      @handleClicked="handleProjectClicked($event)"
      @closeTheSearch="closeSearchBox"
    />
    <ExplorePortfolios
      @toggleTheOpenPortfolios="handleToggleOpenProjects('SuggestedProjects')"
      :showOpenPortfolios="showOpenProjects.SuggestedProjects"
      :componentName="'SuggestedProjects'"
      :title="'Suggested Projects based on the Job Proposal'"
      :noPortfolios="'No Matching projects found!'"
      :suggestedPortfolios="suggestedProjects"
      :loading="loading"
      :checkedLabel="checkedLabel"
      :suggestedPortfoliosCount="suggestedProjectsCount"
      :suggestedPortfoliosPage="suggestedProjectsPage"
      :portfoliosTableHeadings="projectsTableHeadings"
      :type="'Project'"
      :portfoliosPerPage="projectsPerPage"
      @clickOnLabelChecked="clickLabelChecked($event)"
      @loadThePrevSuggestedPortfolios="loadPrevSuggestedProjects"
      @loadTheNextSuggestedPortfolios="loadNextSuggestedProjects"
      @openThePreview="openPreview($event)"
    />
    <ExplorePortfolios
      @toggleTheOpenPortfolios="handleToggleOpenProjects('SelectedProjects')"
      :showOpenPortfolios="showOpenProjects.SelectedProjects"
      :componentName="'SelectedProjects'"
      :title="'Selected Projects'"
      :noPortfolios="'No Projects selected!'"
      :loading="false"
      :selectedPortfolios="selectedProjects"
      :checkedLabel="checkedLabel"
      :portfoliosTableHeadings="projectsTableHeadings"
      :type="'Project'"
      @clickOnLabelCheckedSelectedPortfolios="clickLabelCheckedSelectedProjects($event)"
      @openThePreview="openPreview($event)"
    />
  </div>
  <div v-if="previewOpen">
    <Preview
      :portfolio="openProject"
      @closeThePreview="closePreview"
      :selectedPortfolios="selectedProjects"
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
  name: "ProjectsSection",
  components: { ExplorePortfolios, Search, Preview, "a-button": Button },
  emits: ["goToNext", "goToBack"],
  data() {
    return {
      showOpenProjects: {
        SuggestedProjects: true,
        SelectedProjects: true,
      },
      projectsTableHeadings: {
        projects: "Projects",
        tags: "Tags",
      },
      suggestedProjects: [],
      selectedProjects: [],
      selectedProjectsGlobal: [],
      loading: false,
      searchLoading: false,
      noProjectMatched: false,
      search: "",
      searchBox: false,
      searchResult: [],
      checkedLabel: [],
      projectsPerPage: 0,
      suggestedProjectsCount: 0,
      suggestedProjectsPage: 1,
      previewOpen: false,
      openProject: {},
    };
  },
  methods: {
    ...mapActions("projects", [
      "updateSelectedProjects",
      "updateCheckedLabel",
      "updateMatchedProjectsPage",
    ]),

    handleToggleOpenProjects(childComponentName) {
      // Toggle the clicked component
      this.showOpenProjects[childComponentName] = !this.showOpenProjects[
        childComponentName
      ];
    },
    updateSelectedProjectsHandler(newSelectedProjects) {
      this.updateSelectedProjects(newSelectedProjects);
    },
    updateCheckedLabelHandler(newCheckedLabel) {
      this.updateCheckedLabel(newCheckedLabel);
    },
    closeSearchBox() {
      this.searchBox = false;
    },
    openPreview(portfolio) {
      this.previewOpen = true;
      const matchingProject = this.selectedProjects.find(
        (project) => project.name === portfolio.name
      );

      if (matchingProject) {
        // Portfolio exists in selectedProjects, update it
        this.openProject = matchingProject;
      } else {
        this.openProject = portfolio;
      }
    },
    closePreview() {
      this.previewOpen = false;
    },
    // update suggested projects with new page
    async updateSuggestedProjectsPageHandler(newPage) {
      await this.updateMatchedProjectsPage(newPage);
    },
    pushProject(project) {
      // create another property with every link, which is checked initially set to true, it will help us show the links in that project's preview
      project.links.forEach((link) => (link.checked = true));
      this.selectedProjects.push(project);
    },
    removeProject(project) {
      if (this.selectedProjects.length > 0) {
        this.selectedProjects = this.selectedProjects.filter(
          (selectedProject) => selectedProject.name !== project.name
        );
      }
    },
    pushSelectedProject(project) {
      // don't push the project in the this.selectedProjects, so that it does not show in the UI, this code will only update the state of selectedProjects in vuex
      this.selectedProjectsGlobal.push(project);
      this.updateSelectedProjectsHandler(this.selectedProjectsGlobal);
    },
    removeSelectedProject(project) {
      // don't remove the project from the this.selectedProjects, so that it does not show in the UI, this code will only update the state of selectedProjects in vuex
      if (this.selectedProjectsGlobal.length > 0) {
        this.selectedProjectsGlobal = this.selectedProjectsGlobal.filter(
          (selectedProject) => selectedProject.name !== project.name
        );
        this.updateSelectedProjectsHandler(this.selectedProjectsGlobal);
      }
    },
    clickLabelChecked(project) {
      if (this.checkedLabel.includes(project.name)) {
        this.checkedLabel = this.checkedLabel.filter((item) => item !== project.name);
        this.removeProject(project);
      } else {
        this.checkedLabel.push(project.name);
        if (!this.selectedProjects.includes(project)) {
          this.pushProject(project);
        }
      }
      // call update methods for updating state of selectedProjects and checkedLabel
      this.updateSelectedProjectsHandler(this.selectedProjects);
      this.updateCheckedLabelHandler(this.checkedLabel);
    },
    clickLabelCheckedSelectedProjects(project) {
      if (this.checkedLabel.includes(project.name)) {
        this.checkedLabel = this.checkedLabel.filter((item) => item !== project.name);
        this.removeSelectedProject(project);
      } else {
        this.checkedLabel.push(project.name);
        this.pushSelectedProject(project);
      }
      // call update methods for updating state of checkedLabel
      this.updateCheckedLabelHandler(this.checkedLabel);
    },
    handleProjectClicked(project) {
      // push the project in selected projects and also check the label
      if (!this.checkedLabel.includes(project.name)) {
        this.checkedLabel.push(project.name);
        if (!this.selectedProjects.includes(project)) {
          this.pushProject(project);
        }
      }
      //close the search box
      this.searchBox = false;
    },
    debouncedSearch: debounce(function (query) {
      this.fetchAllProjects(query);
    }, 300),

    async fetchAllProjects(query) {
      this.searchLoading = true;
      try {
        this.noProjectMatched = false;
        const { portfolios } = await getPortfolios(PORTFOLIO_TYPE.PROJECT, 1, query);
        if (portfolios) {
          if (portfolios.length === 0) {
            this.noProjectMatched = true;
            // this.allProjects = [];
          } else {
            this.searchResult = portfolios;
            // this.allProjects = portfolios;
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

    async loadNextSuggestedProjects() {
      if (
        this.suggestedProjectsCount !== 0 &&
        this.suggestedProjectsPage < this.suggestedProjectsCount / this.projectsPerPage
      ) {
        this.suggestedProjectsPage = this.suggestedProjectsPage + 1;
        this.updateSuggestedProjectsPageHandler(this.suggestedProjectsPage);
        await this.$store.dispatch(
          "projects/fetchMatchedProjects",
          this.suggestedProjectsPage
        );
        this.suggestedProjects = this.$store.state.projects.matchedProjects;
      }
    },

    async loadPrevSuggestedProjects() {
      if (this.suggestedProjectsPage > 1) {
        this.suggestedProjectsPage = this.suggestedProjectsPage - 1;
        this.updateSuggestedProjectsPageHandler(this.suggestedProjectsPage);
        await this.$store.dispatch(
          "projects/fetchMatchedProjects",
          this.suggestedProjectsPage
        );
        this.suggestedProjects = this.$store.state.projects.matchedProjects;
      }
    },

    linkClicked(project) {
      this.selectedProjects.map((selectedProject) => {
        if (selectedProject.id === project.id) {
          return project; // Replace with the updated object
        }
        return selectedProject; // Keep the original object if it's not the one to be updated
      });
      this.updateSelectedProjectsHandler(this.selectedProjects);
    },
    goNext() {
      this.$emit("goToNext");
    },
    goBack() {
      this.$emit("goToBack");
    },
  },
  watch: {
    "$store.state.projects.matchedProjects"(newValue) {
      this.suggestedProjects = newValue;
    },
    "$store.state.projects.matchedProjectsPerPage"(newValue) {
      this.projectsPerPage = newValue;
    },
    "$store.state.projects.matchedProjectsCount"(newValue) {
      this.suggestedProjectsCount = newValue;
    },
    "$store.state.projects.matchedProjectsPage"(newValue) {
      this.suggestedProjectsPage = newValue;
    },
  },
  async mounted() {
    this.loading = true;
    this.suggestedProjects = this.$store.state.projects.matchedProjects;
    this.selectedProjects = this.$store.state.projects.selectedProjects;
    this.selectedProjectsGlobal = this.$store.state.projects.selectedProjects;
    this.checkedLabel = this.$store.state.projects.checkedLabel;
    this.projectsPerPage = this.$store.state.projects.matchedProjectsPerPage;
    this.suggestedProjectsCount = this.$store.state.projects.matchedProjectsCount;
    this.suggestedProjectsPage = this.$store.state.projects.matchedProjectsPage;
    this.loading = false;
  },
};
</script>
