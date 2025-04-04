const state = {
    currentView: "",
  };
  
  const mutations = {
    SET_CURRENT_VIEW(state, currentView) {
      state.currentView = currentView;
    },
  };
  
  const actions = {
    updateCurrentView({ commit }, currentView) {
      commit("SET_CURRENT_VIEW", currentView);
    },
  };
  
  export default {
      namespaced: true, // Optional but recommended for namespacing
      state,
      mutations,
      actions,
    };