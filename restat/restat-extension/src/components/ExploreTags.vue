<template>
  <div class="mb-3">
    <div
      class="rs-custom-div"
      @click="toggleOpenTags"
      :class="{ hidden: showOpenTags }"
    >
      <div>{{ this.title }}</div>
      <CaretDownOutlined style="color: white; font-size: 16px;" />
    </div>
    <div class="rs-open-tags-div" :class="{ hidden: !showOpenTags }">
      <div class="rs-custom-div-open" @click="toggleOpenTags">
        <div>{{ this.title }}</div>
        <CaretUpOutlined style="color: white; font-size: 16px;" />
      </div>
      <div
        class="rs-the-tags-container"
      >
        <div v-if="loading" class="rs-central-loading">
          <div class="rs-loading-circle"></div>
        </div>
        <div v-else-if="suggestedTags && suggestedTags.length > 0">
          <div class="rs-container-of-tags">
            <div
              v-for="(tag, i) in suggestedTags"
              :key="i"
              :class="
                selectedTags.includes(tag) ? 'selected-rs-tags-tag' : 'rs-tags-tag'
              "
              @click="selectDeselect(tag)"
            >
              {{ tag }}
            </div>
          </div>
          <div v-if="tagsCount !== 0 && tagsCount > tagsPerPage" class="rs-next-back-container">
            <LeftOutlined @click="decrementSuggestedTagsPage" style="color: white; font-size: 16px; margin-right: 1rem;" />
            <RightOutlined @click="incrementSuggestedTagsPage" style="color: white; font-size: 16px;" />
          </div>
        </div>
        <div
          v-else-if="selectedTags && selectedTags.length > 0"
          class="rs-container-of-tags"
        >
          <div
            v-for="(tag, i) in selectedTags"
            :key="i"
            class="selected-rs-tags-tag"
          >
            <span class="rs-selectedTagsTag">
              {{ tag }}
            </span>
            <span class="rs-selectedTagsTagHover"
              >{{ truncate(tag) }}
              <i @click="setRemoveTagsFromList(tag)">X</i>
            </span>
          </div>
        </div>
        <div v-else>{{ noTags }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { CaretDownOutlined, CaretUpOutlined, RightOutlined, LeftOutlined } from '@ant-design/icons-vue';
export default {
  name: "ExploreTags",
  components: { CaretDownOutlined, CaretUpOutlined, RightOutlined, LeftOutlined },
  props: [
    "showOpenTags",
    "componentName",
    "title",
    "noTags",
    "suggestedTags",
    "selectedTags",
    "loading",
    "suggestedTagsPage",
    "tagsCount",
    "tagsPerPage"
  ],

  data() {
    return {

    }
  },
  methods: {
    toggleOpenTags() {
      this.$emit("toggleTheOpenTags");
    },
    selectDeselect(tag) {
      this.$emit("selectDeselectTags", tag);
    },
    truncate(data) {
      if (data.length > 5) {
        return data.split("").slice(0, -4).join("") + " ...";
      }
      return data;
    },
    setRemoveTagsFromList(tag) {
      this.$emit("removeTag", tag);
    },
    incrementSuggestedTagsPage() {
      this.$emit("loadTheNextSuggestedTags");
    },
    decrementSuggestedTagsPage() {
      this.$emit("loadThePrevSuggestedTags");
    },
  },
  
};
</script>

<style>
.hidden {
  display: none;
}
</style>
