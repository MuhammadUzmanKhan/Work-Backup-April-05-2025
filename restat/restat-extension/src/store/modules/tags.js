import { captureExtensionError, getJobSkills } from "../../utility/parserHelper";
import { getTags } from "@/provider";

const state = {
  suggestedTags: [],
  allTags: [],
  selectedTags: [],
  tagsCount: 0,
  allTagsCount: 0,
  tagsPerPage: 0,
  allTagsPage: 1,
  suggestedTagsPage: 1,
};

const mutations = {
  SET_TAGS(state, { allTags, tags, tagsCount, allTagsCount, tagsPerPage }) {
    state.allTags = allTags;
    state.suggestedTags = tags;
    (state.tagsCount = tagsCount),
      (state.allTagsCount = allTagsCount),
      (state.tagsPerPage = tagsPerPage);
  },
  SET_ALL_TAGS(state, { allTags, allTagsCount, tagsPerPage }) {
    state.allTags = allTags;
    (state.allTagsCount = allTagsCount), (state.tagsPerPage = tagsPerPage);
  },
  SET_SUGGESTED_TAGS(state, { tags, tagsCount, tagsPerPage }) {
    state.suggestedTags = tags;
    (state.tagsCount = tagsCount), (state.tagsPerPage = tagsPerPage);
  },
  SET_SELECTED_TAGS(state, selectedTags) {
    state.selectedTags = selectedTags;
  },
  SET_ALL_TAGS_PAGE(state, page) {
    state.allTagsPage = page;
  },
  SET_SUGGESTED_TAGS_PAGE(state, page) {
    state.suggestedTagsPage = page;
  },
};

const actions = {
  async fetchTags({ commit }) {
    const jobSkills = await getJobSkills();
    try {
      const { allTags, tags, tagsCount, allTagsCount, tagsPerPage } =
        await getTags(jobSkills);
      commit("SET_TAGS", {
        allTags,
        tags,
        tagsCount,
        allTagsCount,
        tagsPerPage,
      });
    } catch (error) {
      captureExtensionError(error);
    }
  },
  async fetchAllTags({ commit }, page = 1) {
    const jobSkills = await getJobSkills();
    try {
      const { allTags, allTagsCount, tagsPerPage } = await getTags(
        jobSkills,
        page
      );
      commit("SET_ALL_TAGS", {
        allTags,
        allTagsCount,
        tagsPerPage,
      });
    } catch (error) {
      captureExtensionError(error);
    }
  },
  async fetchSuggestedTags({ commit }, page = 1) {
    const jobSkills = await getJobSkills();
    try {
      const { tags, tagsCount, tagsPerPage } = await getTags(jobSkills, page);
      commit("SET_SUGGESTED_TAGS", {
        tags,
        tagsCount,
        tagsPerPage,
      });
    } catch (error) {
      captureExtensionError(error);
    }
  },
  updateSelectedTags({ commit }, tags) {
    commit("SET_SELECTED_TAGS", tags);
  },
  updateAllTagsPage({ commit }, page) {
    commit("SET_ALL_TAGS_PAGE", page);
  },
  updateSuggestedTagsPage({ commit }, page) {
    commit("SET_SUGGESTED_TAGS_PAGE", page);
  },
};

export default {
  namespaced: true, // Optional but recommended for namespacing
  state,
  mutations,
  actions,
};
