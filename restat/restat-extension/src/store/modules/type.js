const state = {
  type: "",
};

const mutations = {
  SET_TYPE(state, type) {
    state.type = type;
  },
};

const actions = {
  updateType({ commit }, type) {
    commit("SET_TYPE", type);
  },
};

export default {
    namespaced: true, // Optional but recommended for namespacing
    state,
    mutations,
    actions,
  };