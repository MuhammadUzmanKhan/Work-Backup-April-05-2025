import { captureExtensionError } from "@/utility/parserHelper";
import { countLinkedinConnects } from "@/provider";

const state = {
  linkedinConnectsMonthlyCountByBidder: 0,
  linkedinConnectsDailyCountByBidder: 0,
  linkedinProspectsMonthlyCountByBidder: 0,
  linkedinProspectsDailyCountByBidder: 0,
};

const mutations = {
  SET_CONNECTS(
    state,
    { linkedinConnectsMonthlyCountByBidder, linkedinConnectsDailyCountByBidder, linkedinProspectsMonthlyCountByBidder, linkedinProspectsDailyCountByBidder }
  ) {
    state.linkedinConnectsMonthlyCountByBidder =
      linkedinConnectsMonthlyCountByBidder;
    state.linkedinConnectsDailyCountByBidder =
      linkedinConnectsDailyCountByBidder;
      state.linkedinProspectsMonthlyCountByBidder =
      linkedinProspectsMonthlyCountByBidder;
    state.linkedinProspectsDailyCountByBidder =
    linkedinProspectsDailyCountByBidder;
  },
};

const actions = {
  async fetchLinkedinConnects({ commit }) {
    try {
      const {
        thisMonthConnections,
        thisDayConnections,
        thisMonthProspects,
        thisDayProspects,
        error,
      } = await countLinkedinConnects();
      if (error) {
        captureExtensionError(error);
      }
      commit("SET_CONNECTS", {
        thisMonthConnections,
        thisDayConnections,
        thisMonthProspects,
        thisDayProspects,
      });
      const linkedinConnectDailyCount = {};
      linkedinConnectDailyCount.linkedinConnectDailyCount =
      thisDayConnections;
      const linkedinConnectMonthlyCount = {};
      linkedinConnectMonthlyCount.linkedinConnectMonthlyCount =
      thisMonthConnections;
      const linkedinProspectDailyCount = {};
      linkedinProspectDailyCount.linkedinProspectDailyCount =
      thisDayProspects;
      const linkedinProspectMonthlyCount = {};
      linkedinProspectMonthlyCount.linkedinProspectMonthlyCount =
      thisMonthProspects;
      await chrome.storage.sync.set(linkedinConnectDailyCount);
      await chrome.storage.sync.set(linkedinConnectMonthlyCount);
      await chrome.storage.sync.set(linkedinProspectDailyCount);
      await chrome.storage.sync.set(linkedinProspectMonthlyCount);
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
