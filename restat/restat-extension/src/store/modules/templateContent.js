const state = {
    templateContent: "",
  };
  
  const mutations = {
    SET_TEMPLATE_CONTENT(state, templateContent) {
      state.templateContent = templateContent;
    },
  };
  
  const actions = {
    updateTemplateContent({ commit }, templateContent) {
      commit("SET_TEMPLATE_CONTENT", templateContent);
    },
  };
  
  export default {
      namespaced: true, // Optional but recommended for namespacing
      state,
      mutations,
      actions,
    };