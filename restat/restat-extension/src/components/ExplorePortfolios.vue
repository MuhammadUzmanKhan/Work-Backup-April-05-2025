<template>
  <div class="mb-3">
    <div class="rs-custom-div" @click="toggleOpenPortfolios" :class="{ hidden: showOpenPortfolios }">
      <div>{{ this.title }}</div>
      <CaretDownOutlined style="color: white; font-size: 16px;" />
    </div>
    <div class="rs-open-projects-div" :class="{ hidden: !showOpenPortfolios }">
      <div class="rs-custom-div-open" @click="toggleOpenPortfolios">
        <div>{{ this.title }}</div>
        <CaretUpOutlined style="color: white; font-size: 16px;" />
      </div>
      <div class="rs-portfolios-container">
        <div v-if="theLoading && suggestedPortfolios" class="d-flex justify-content-center align-items-center m-2">
          <div class="rs-loading-circle"></div>
        </div>
        <div v-else-if="suggestedPortfolios && suggestedPortfolios.length > 0">
          <Table :tableHeadings="portfoliosTableHeadings" :portfolios="suggestedPortfolios" :checkedLabel="checkedLabel"
            :type="type" @onClickLabelChecked="clickTheLabelChecked($event)"
            @displayThePreview="displayPreview($event)" />
          <div v-if="suggestedPortfoliosCount !== 0 &&
      suggestedPortfoliosCount > portfoliosPerPage
      " class="mt-2 rs-next-back-container">
            <LeftOutlined @click="decrementSuggestedPortfoliosPage" style="color: white; font-size: 16px; margin-right: 1rem;" />
            <RightOutlined @click="incrementSuggestedPortfoliosPage" style="color: white; font-size: 16px;" />
          </div>
        </div>
        <div v-else-if="selectedPortfolios && selectedPortfolios.length > 0">
          <Table :tableHeadings="portfoliosTableHeadings" :portfolios="selectedPortfolios" :selectedPort="true"
            :checkedLabel="checkedLabel" :type="type" @onClickLabelCheckedSelectedPortfolios="
      clickTheLabelCheckedSelectedPortfolios($event)
      " @displayThePreview="displayPreview($event)" />
        </div>
        <div v-else>{{ noPortfolios }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import Table from "./Table.vue";
import { CaretDownOutlined, CaretUpOutlined, RightOutlined, LeftOutlined } from '@ant-design/icons-vue';

export default {
  name: "ExplorePortfolios",
  components: { Table, CaretDownOutlined, CaretUpOutlined, RightOutlined, LeftOutlined },
  data() {
    return {
      theLoading: false
    }
  },
  props: [
    "portfoliosTableHeadings",
    "showOpenPortfolios",
    "componentName",
    "title",
    "type",
    "noPortfolios",
    "suggestedPortfolios",
    "selectedPortfolios",
    "loading",
    "checkedLabel",
    "search",
    "suggestedPortfoliosCount",
    "suggestedPortfoliosPage",
    "portfoliosPerPage",
  ],

  methods: {
    toggleOpenPortfolios() {
      this.$emit("toggleTheOpenPortfolios");
    },
    clickTheLabelChecked(project) {
      this.$emit("clickOnLabelChecked", project);
    },
    clickTheLabelCheckedSelectedPortfolios(project) {
      this.$emit("clickOnLabelCheckedSelectedPortfolios", project);
    },
    decrementSuggestedPortfoliosPage() {
      this.$emit("loadThePrevSuggestedPortfolios");
    },
    incrementSuggestedPortfoliosPage() {
      this.$emit("loadTheNextSuggestedPortfolios");
    },
    displayPreview(portfolio) {
      this.$emit("openThePreview", portfolio);
    },
  },
  watch: {
    '$store.state.loading.loading'(newValue) {
      // Update theLoading when loading state in Vuex store changes
      this.theLoading = newValue;
    },
  },

  mounted() {
    // Set the initial value of theLoading
    this.theLoading = this.$store.state.loading.loading;
  },
};
</script>

<style>
.hidden {
  display: none;
}
</style>
