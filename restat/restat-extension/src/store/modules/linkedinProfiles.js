import { captureExtensionError } from "@/utility/parserHelper";
import { getProfiles } from "@/provider";

const state = {
  linkedinProfiles: [],
};

const mutations = {
  SET_LINKEDIN_PROFILES(state, profiles) {
    state.linkedinProfiles = profiles;
  },
};

const actions = {
  async fetchLinkedinProfiles({ commit }) {
    try {
      const source = "LINKEDIN";
      const { profiles, error } = await getProfiles(source);
      if (error) {
        captureExtensionError(error);
      }
      commit("SET_LINKEDIN_PROFILES", {
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
