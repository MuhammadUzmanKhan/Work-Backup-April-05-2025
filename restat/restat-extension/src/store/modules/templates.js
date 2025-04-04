// import { getJobSkills } from "../../parserHelper";
import { getMatchedPortfolios } from "@/provider";
import { PORTFOLIO_TYPE } from "../../utility/portfolioType";
import { captureExtensionError } from "@/utility/parserHelper";

const state = {
  matchedTemplates: [],
  selectedTemplate: [],
  checkedLabel: [],
  matchedTemplatesCount: 0,
  matchedTemplatesPerPage: 0,
  matchedTemplatesPage: 1,
};

const mutations = {
  SET_MATCHED_TEMPLATES(
    state,
    { matchedTemplates, matchedTemplatesCount, matchedTemplatesPerPage }
  ) {
    state.matchedTemplates = matchedTemplates;
    state.matchedTemplatesCount = matchedTemplatesCount;
    state.matchedTemplatesPerPage = matchedTemplatesPerPage;
  },
  SET_SELECTED_TEMPLATES(state, template) {
    state.selectedTemplate = template;
  },
  SET_CHECKED_LABEL(state, labels) {
    state.checkedLabel = labels;
  },
  SET_MATCHED_TEMPLATES_PAGE(state, page) {
    state.matchedTemplatesPage = page;
  },
};

const actions = {
  async fetchMatchedTemplates({ commit }, matchedTemplatesPage = 1) {
    const selectedTags = this.state.tags.selectedTags;
    try {
      const {
        matchedPortfolios,
        matchedPortfoliosCount,
        matchedPortfoliosPerPage,
        error,
      } = await getMatchedPortfolios(
        PORTFOLIO_TYPE.TEMPLATE,
        selectedTags,
        matchedTemplatesPage
      );
      if (error) {
        captureExtensionError(error);
      }
      const matchedTemplates = matchedPortfolios;
      const matchedTemplatesCount = matchedPortfoliosCount;
      const matchedTemplatesPerPage = matchedPortfoliosPerPage;
      commit("SET_MATCHED_TEMPLATES", {
        matchedTemplates,
        matchedTemplatesCount,
        matchedTemplatesPerPage,
      });
    } catch (error) {
      captureExtensionError(error);
    }
  },
  updateSelectedTemplate({ commit }, template) {
    commit("SET_SELECTED_TEMPLATES", template);
  },
  updateCheckedLabel({ commit }, labels) {
    commit("SET_CHECKED_LABEL", labels);
  },
  updateMatchedTemplatesPage({ commit }, page) {
    commit("SET_MATCHED_TEMPLATES_PAGE", page);
  },
};

export default {
  namespaced: true, // Optional but recommended for namespacing
  state,
  mutations,
  actions,
};
