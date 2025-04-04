import { captureExtensionError } from "@/utility/parserHelper";
import { getProfiles } from "@/provider";

const state = {
  upworkProfiles: [],
};

const mutations = {
  SET_UPWORK_PROFILES(state, profiles) {
    state.upworkProfiles = profiles;
  },
};

const actions = {
  async fetchUpworkProfiles({ commit }) {
    try {
      const source = "UPWORK";
      const { profiles, error } = await getProfiles(source);
      if (error) {
        captureExtensionError(error);
      }
      commit("SET_UPWORK_PROFILES", {
        profiles,
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
