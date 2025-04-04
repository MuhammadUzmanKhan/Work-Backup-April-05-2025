import { captureExtensionError } from "@/utility/parserHelper";
import { countBids } from "@/provider";

const state = {
  bidMonthlyCountByBidder: 0,
  bidDailyCountByBidder: 0,
  leadMonthlyCountByBidder: 0,
  leadDailyCountByBidder: 0,
};

const mutations = {
  SET_BIDS(state, { bidMonthlyCountByBidder, bidDailyCountByBidder, leadMonthlyCountByBidder, leadDailyCountByBidder }) {
    state.bidMonthlyCountByBidder = bidMonthlyCountByBidder;
    state.bidDailyCountByBidder = bidDailyCountByBidder;
    state.leadMonthlyCountByBidder = leadMonthlyCountByBidder;
    state.leadDailyCountByBidder = leadDailyCountByBidder;
  },
};

const actions = {
  async fetchBids({ commit }) {
    try {
      const { bidMonthlyCountByBidder, bidDailyCountByBidder, leadMonthlyCountByBidder, leadDailyCountByBidder, error } =
        await countBids();
      if (error) {
        captureExtensionError(error);
      }
      commit("SET_BIDS", {
        bidMonthlyCountByBidder,
        bidDailyCountByBidder,
        leadMonthlyCountByBidder,
        leadDailyCountByBidder
      });

      const bidDailyCount = {};
      bidDailyCount.bidDailyCount = bidDailyCountByBidder;
      const bidMonthlyCount = {};
      bidMonthlyCount.bidMonthlyCount = bidMonthlyCountByBidder;
      const leadDailyCount = {};
      leadDailyCount.leadDailyCount = leadDailyCountByBidder;
      const leadMonthlyCount = {};
      leadMonthlyCount.leadMonthlyCount = leadMonthlyCountByBidder;
      await chrome.storage.sync.set(bidDailyCount);
      await chrome.storage.sync.set(bidMonthlyCount);
      await chrome.storage.sync.set(leadDailyCount);
      await chrome.storage.sync.set(leadMonthlyCount);
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
