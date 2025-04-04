const state = {
    loading: false,
  };
  
  const mutations = {
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
  };
  
  const actions = {
    updateLoading({ commit }, loading) {
      commit("SET_LOADING", loading);
    },
  };
  
  export default {
      namespaced: true, // Optional but recommended for namespacing
      state,
      mutations,
      actions,
    };