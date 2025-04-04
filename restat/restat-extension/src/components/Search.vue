<template>
  <div class="rs-search-div">
    <div class="mb-3 custom-rs-search-div">
      <input :value="search" @input="changeSearch"
        :class="{ 'rs-save-template-field-input': tagsSearch, 'rs-custom-search-input': !tagsSearch }"
        :placeholder="placeholder" />
      <SearchOutlined width="20" height="20" :class="{ 'rs-search-icon-tags': tagsSearch, 'rs-search-icon': !tagsSearch }"
        style="color: white; font-size: 20px;" />
    </div>
    <div v-if="searchBox" class="rs-search-box w-full">
      <div class="relative">
        <CloseOutlined @click="closeSearch" class="rs-close-button" style="color: #787676; font-size: 12px;" />
      </div>
      <div v-if="loading" class="d-flex justify-content-center align-items-center m-2">
        <div class="rs-loading-circle"></div>
      </div>
      <div v-else>
        <div v-if="noMatched" class="d-flex justify-content-center align-items-center m-2">
          No {{ item }} Matched the search.
        </div>
        <div v-else v-for="item in searchResult" :key="item.id" class="pl-2 p-0.5 mb-2 cursor-pointer"
          @click="handleClick(item)">
          {{ item.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { SearchOutlined, CloseOutlined } from '@ant-design/icons-vue';
export default {
  name: "SearchItem",
  components: {
    SearchOutlined,
    CloseOutlined
  },
  props: [
    "search",
    "noMatched",
    "item",
    "searchResult",
    "searchBox",
    "loading",
    "searchTags",
    "tagsSearch"
  ],
  computed: {
    placeholder() {
      return "Search " + this.item;
    },
  },
  methods: {
    changeSearch(event) {
      this.$emit("onTheChangeSearch", event);
    },
    handleClick(item) {
      this.$emit("handleClicked", item);
    },
    closeSearch() {
      this.$emit("closeTheSearch");
    },
  }
};
</script>

<style>
.relative {
  position: relative;
}
</style>
