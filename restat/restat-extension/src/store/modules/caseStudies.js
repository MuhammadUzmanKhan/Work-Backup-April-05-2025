// import { getJobSkills } from "../../parserHelper";
import { getMatchedPortfolios } from "@/provider";
import { PORTFOLIO_TYPE } from "../../utility/portfolioType";
import { captureExtensionError } from "@/utility/parserHelper";

const state = {
  matchedCaseStudies: [],
  selectedCaseStudies: [],
  checkedLabel: [],
  matchedCaseStudiesCount: 0,
  matchedCaseStudiesPerPage: 0,
  matchedCaseStudiesPage: 1,
};

const mutations = {
  SET_MATCHED_CASESTUDIES(
    state,
    { matchedCaseStudies, matchedCaseStudiesCount, matchedCaseStudiesPerPage }
  ) {
    state.matchedCaseStudies = matchedCaseStudies;
    state.matchedCaseStudiesCount = matchedCaseStudiesCount;
    state.matchedCaseStudiesPerPage = matchedCaseStudiesPerPage;
  },
  SET_SELECTED_CASESTUDIES(state, CaseStudies) {
    state.selectedCaseStudies = CaseStudies;
  },
  SET_CHECKED_LABEL(state, labels) {
    state.checkedLabel = labels;
  },
  SET_MATCHED_CASESTUDIES_PAGE(state, page) {
    state.matchedCaseStudiesPage = page;
  },
};

const actions = {
  async fetchMatchedCaseStudies({ commit }, matchedCaseStudiesPage = 1) {
    const selectedTags = this.state.tags.selectedTags;
    try {
      const {
        matchedPortfolios,
        matchedPortfoliosCount,
        matchedPortfoliosPerPage,
        error,
      } = await getMatchedPortfolios(
        PORTFOLIO_TYPE.CASE_STUDY,
        selectedTags,
        matchedCaseStudiesPage
      );
      if (error) {
        captureExtensionError(error);
      }
      const matchedCaseStudies = matchedPortfolios;
      const matchedCaseStudiesCount = matchedPortfoliosCount;
      const matchedCaseStudiesPerPage = matchedPortfoliosPerPage;
      commit("SET_MATCHED_CASESTUDIES", {
        matchedCaseStudies,
        matchedCaseStudiesCount,
        matchedCaseStudiesPerPage,
      });
    } catch (error) {
      captureExtensionError(error);
    }
  },
  updateSelectedCaseStudies({ commit }, CaseStudies) {
    commit("SET_SELECTED_CASESTUDIES", CaseStudies);
  },
  updateCheckedLabel({ commit }, labels) {
    commit("SET_CHECKED_LABEL", labels);
  },

  updateMatchedCaseStudiesPage({ commit }, page) {
    commit("SET_MATCHED_CASESTUDIES_PAGE", page);
  },
};

export default {
  namespaced: true, // Optional but recommended for namespacing
  state,
  mutations,
  actions,
};
