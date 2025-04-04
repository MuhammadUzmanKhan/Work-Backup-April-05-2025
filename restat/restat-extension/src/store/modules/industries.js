import { captureExtensionError } from "@/utility/parserHelper";
import { getIndustries } from "@/provider";

const state = {
  industries: [],
};

const mutations = {
  SET_INDUSTRIES(state, industries) {
    state.industries = industries;
  },
};

const actions = {
  async fetchIndustries({ commit }) {
    try {
      const { industries, error } = await getIndustries();
      if (error) {
        captureExtensionError(error);
      }
      commit("SET_INDUSTRIES", {
        industries,
      });
    } catch (error) {
      captureExtensionError(error);
    }
  },
};

export default {
  namespaced: true, // Optional but recommended for namespacing
  state,
  mutations,
  actions,
};
