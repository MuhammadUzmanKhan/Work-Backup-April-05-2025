// import { getJobSkills } from "../../parserHelper";
import { getMatchedPortfolios } from "@/provider";
import { PORTFOLIO_TYPE } from "../../utility/portfolioType";
import { captureExtensionError } from "@/utility/parserHelper";

const state = {
  matchedProjects: [],
  selectedProjects: [],
  checkedLabel: [],
  matchedProjectsCount: 0,
  matchedProjectsPerPage: 0,
  matchedProjectsPage: 1,
};

const mutations = {
  SET_MATCHED_PROJECTS(
    state,
    { matchedProjects, matchedProjectsCount, matchedProjectsPerPage }
  ) {
    state.matchedProjects = matchedProjects;
    state.matchedProjectsCount = matchedProjectsCount;
    state.matchedProjectsPerPage = matchedProjectsPerPage;
  },
  SET_SELECTED_PROJECTS(state, projects) {
    state.selectedProjects = projects;
  },
  SET_CHECKED_LABEL(state, labels) {
    state.checkedLabel = labels;
  },
  SET_MATCHED_PROJECTS_PAGE(state, page) {
    state.matchedProjectsPage = page;
  },
};

const actions = {
  async fetchMatchedProjects({ commit }, matchedProjectsPage = 1) {
    const selectedTags = this.state.tags.selectedTags;
    try {
      const {
        matchedPortfolios,
        matchedPortfoliosCount,
        matchedPortfoliosPerPage,
        error,
      } = await getMatchedPortfolios(
        PORTFOLIO_TYPE.PROJECT,
        selectedTags,
        matchedProjectsPage
      );
      if (error) {
        captureExtensionError(error);
      }
      const matchedProjects = matchedPortfolios;
      const matchedProjectsCount = matchedPortfoliosCount;
      const matchedProjectsPerPage = matchedPortfoliosPerPage;
      commit("SET_MATCHED_PROJECTS", {
        matchedProjects,
        matchedProjectsCount,
        matchedProjectsPerPage,
      });
    } catch (error) {
      captureExtensionError(error);
    }
  },
  updateSelectedProjects({ commit }, projects) {
    commit("SET_SELECTED_PROJECTS", projects);
  },
  updateCheckedLabel({ commit }, labels) {
    commit("SET_CHECKED_LABEL", labels);
  },

  updateMatchedProjectsPage({ commit }, page) {
    commit("SET_MATCHED_PROJECTS_PAGE", page);
  },
};

export default {
  namespaced: true, // Optional but recommended for namespacing
  state,
  mutations,
  actions,
};
