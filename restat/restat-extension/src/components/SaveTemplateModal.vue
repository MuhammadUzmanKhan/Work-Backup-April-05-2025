<template>
  <div class="rs-save-template-detail-block">
    <div class="rs-save-template-detail-head">
      <span><strong>Save Template</strong> - Click "Save" to save template </span>
      <CloseOutlined @click="close" style="font-size: 12px; color: white" />
    </div>
    <p class="mt-3 mb-3 rs-align-center">Are you sure you want to save this template!</p>
    <form @submit.prevent="saveTemplate">
      <div class="rs-custom-field-div rs-custom-margin">
        <input
          class="rs-save-template-field-input"
          type="text"
          placeholder="Template Title"
          :value="templateTitle"
          @input="$emit('updateTemplateTitle', $event.target.value)"
        />
      </div>
      <p v-if="error" class="rs-custom-margin rs-error-msg">* {{ errorMessage }}</p>
      <p v-else-if="success" class="rs-custom-margin rs-success-msg">
        {{ successMessage }}
      </p>
    </form>
    <div class="rs-container-of-tags-custom mx-3 mt-1">
      <div v-for="(tag, i) in tags" :key="i" class="selected-rs-tags-tag">
        <span class="rs-selectedTagsTag">
          {{ tag.name }}
        </span>
        <span class="rs-selectedTagsTagHover"
          >{{ truncate(tag.name) }}
          <i @click="setRemoveTagFromList(tag)">X</i>
        </span>
      </div>
      <span class="rs-add-tags-btn" @click="setShowTagsDiv"> Add Tags </span>
    </div>
    <p v-if="noTagsError" class="rs-custom-margin mt-1 rs-error-msg">
      * {{ noTagsErrorMessage }}
    </p>
    <div v-if="showTagsDiv" class="rs-custom-margin">
      <Search
        item="Tag"
        :search="search"
        :tagsSearch="true"
        :noMatched="noTagsMatched"
        :searchResult="searchResult"
        :searchBox="searchBox"
        :loading="searchLoading"
        @onTheChangeSearch="setSearchInput($event)"
        @handleClicked="handleTheTagClicked($event)"
        @closeTheSearch="closeSearchBox"
      />
    </div>
    <div class="rs-button-container-save-template mb-3 mt-3">
      <a-button
        class="rs-save-button"
        @click.stop="saveTheTemplate"
        :class="{ 'rs-disabled-class': templateTitle === '' }"
        :disabled="templateTitle === ''"
      >
        Save
      </a-button>
      <a-button class="rs-cancel-button" @click="close">Cancel</a-button>
    </div>
  </div>
</template>

<script>
import { getTags } from "@/provider";
import Search from "./Search.vue";
import { debounce } from "@/utility/debounce";
import { CloseOutlined } from "@ant-design/icons-vue";
import { Button } from "ant-design-vue";

export default {
  name: "SaveTemplateModal",
  props: [
    "templateTitle",
    "tags",
    "success",
    "error",
    "noTagsError",
    "successMessage",
    "errorMessage",
    "noTagsErrorMessage",
  ],
  components: { Search, CloseOutlined, "a-button": Button },
  data() {
    return {
      hasError: false,
      showTagsDiv: false,
      searchLoading: false,
      searchBox: false,
      noTagsMatched: false,
      search: "",
      searchResult: [],
    };
  },
  methods: {
    close() {
      this.$emit("closeTheModal");
    },
    saveTheTemplate() {
      this.$emit("saveTemplate");
    },
    truncate(data) {
      if (data.length > 5) {
        return data.split("").slice(0, -4).join("") + " ...";
      }
      return data;
    },
    setShowTagsDiv() {
      this.showTagsDiv = true;
    },
    setRemoveTagFromList(tag) {
      this.$emit("removeTag", tag);
    },
    handleTheTagClicked(tag) {
      this.$emit("handleTagClicked", tag);
      this.searchBox = false;
    },
    debouncedSearch: debounce(function (query) {
      this.fetchAllTags(query);
    }, 300),

    async fetchAllTags(query) {
      this.searchLoading = true;
      try {
        this.noProjectMatched = false;
        const { tags } = await getTags([], 1, query);
        if (tags) {
          if (tags.length === 0) {
            this.noTagsMatched = true;
          } else {
            this.searchResult = tags;
            this.noTagsMatched = false;
          }
        } else {
          throw new Error("Failed to fetch fetchAllTags");
        }
      } catch {
        // Intentionally left blank
      } finally {
        this.searchLoading = false;
      }
    },

    setSearchInput(event) {
      const query = event.target.value;
      this.search = query;
      if (query.trim().length >= 3) {
        this.searchBox = true;
        this.debouncedSearch(query);
      }
    },
    closeSearchBox() {
      this.searchBox = false;
    },
  },
};
</script>

<style>
.rs-disabled-class {
  cursor: not-allowed !important;
  color: white !important;
  opacity: 0.5;
}

.rs-align-center {
  text-align: center;
}

.rs-custom-margin {
  margin-left: 0.75rem;
}

.rs-error-msg {
  color: red;
}

.rs-success-msg {
  color: rgb(1, 171, 1);
}
</style>
