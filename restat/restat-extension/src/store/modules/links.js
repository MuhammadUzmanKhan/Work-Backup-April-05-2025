// import { getJobSkills } from "../../parserHelper";
import { getMatchedPortfolios } from "@/provider";
import { PORTFOLIO_TYPE } from "../../utility/portfolioType";
import { captureExtensionError } from "@/utility/parserHelper";

const state = {
  matchedLinks: [],
  selectedLinks: [],
  checkedLabel: [],
  matchedLinksCount: 0,
  matchedLinksPerPage: 0,
  matchedLinksPage: 1,
};

const mutations = {
  SET_MATCHED_LINKS(
    state,
    { matchedLinks, matchedLinksCount, matchedLinksPerPage }
  ) {
    state.matchedLinks = matchedLinks;
    state.matchedLinksCount = matchedLinksCount;
    state.matchedLinksPerPage = matchedLinksPerPage;
  },
  SET_SELECTED_LINKS(state, links) {
    state.selectedLinks = links;
  },
  SET_CHECKED_LABEL(state, labels) {
    state.checkedLabel = labels;
  },
  SET_MATCHED_LINKS_PAGE(state, page) {
    state.matchedLinksPage = page;
  },
};

const actions = {
  async fetchmatchedLinks({ commit }, matchedLinksPage = 1) {
    const selectedTags = this.state.tags.selectedTags;
    try {
      const {
        matchedPortfolios,
        matchedPortfoliosCount,
        matchedPortfoliosPerPage,
        error,
      } = await getMatchedPortfolios(
        PORTFOLIO_TYPE.LINK,
        selectedTags,
        matchedLinksPage
      );
      if (error) {
        captureExtensionError(error);
      }
      const matchedLinks = matchedPortfolios;
      const matchedLinksCount = matchedPortfoliosCount;
      const matchedLinksPerPage = matchedPortfoliosPerPage;
      commit("SET_MATCHED_LINKS", {
        matchedLinks,
        matchedLinksCount,
        matchedLinksPerPage,
      });
    } catch (error) {
      captureExtensionError(error);
    }
  },
  updateselectedLinks({ commit }, links) {
    commit("SET_SELECTED_LINKS", links);
  },
  updateCheckedLabel({ commit }, labels) {
    commit("SET_CHECKED_LABEL", labels);
  },

  updatematchedLinksPage({ commit }, page) {
    commit("SET_MATCHED_LINKS_PAGE", page);
  },
};

export default {
  namespaced: true, // Optional but recommended for namespacing
  state,
  mutations,
  actions,
};
