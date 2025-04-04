<template>
  <div>
    <table class="rs-custom-table">
      <thead>
        <tr>
          <th v-for="(value, i) in Object.values(tableHeadings)" :key="i" :class="[
            'text-light font-weight-bold',
            { 'rs-first-heading': i === 0 },
          ]">
            {{ value }}
          </th>
        </tr>
      </thead>
      <div class="mt-2"></div>
      <tbody>
        <tr v-for="(portfolio, index) in portfolios" :key="index">
          <td class="rs-left-align">
            <label class="rs-checkbox-container" :class="{ 'rs-disabled': selectedPort }">
              {{ portfolio.name }}
              <input type="checkbox" :checked="isCheckedLabel(portfolio.name)" @input="
            selectedPort
              ? onClickCheckedLabelSelectedPortfolios(portfolio)
              : onClickCheckedLabel(portfolio)
            " />

              <span class="rs-checkmark-label"></span>
            </label>
          </td>
          <td>
            <div class="rs-tags-icon-container" @mouseenter="showTags(portfolio.tags, index, $event)"
              @mouseleave="hideTags(index)">
              <TagOutlined style="color: white; font-size: 18px;" />
            </div>
          </td>
          <td>
            <RightOutlined @click="showPreview(portfolio)" style="font-size: 12px; color: white;" />
          </td>
          <div class="portfolio-rs-tags-container" ref="portfolioTagsContainer">
            <div v-for="(tag, i) in portfolio.tags" :key="i" class="portfolio-rs-tags-tag">
              {{ tag.name }}
            </div>
          </div>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import { TagOutlined, RightOutlined } from '@ant-design/icons-vue';
export default {
  name: "TableComponent",
  components: {
    TagOutlined,
    RightOutlined
  },
  props: [
    "tableHeadings",
    "portfolios",
    "checkedLabel",
    "selectedPort",
    "type",
  ],
  methods: {
    ...mapActions("type", ["updateType"]),
    isCheckedLabel(portfolio) {
      return this.checkedLabel.includes(portfolio);
    },
    onClickCheckedLabel(portfolio) {
      this.$emit("onClickLabelChecked", portfolio);
    },
    onClickCheckedLabelSelectedPortfolios(portfolio) {
      this.$emit("onClickLabelCheckedSelectedPortfolios", portfolio);
    },

    updateTypeHandler(type) {
      this.updateType(type);
    },

    showTags(tags, i, event) {
      const portfolioTagsContainer = this.$refs.portfolioTagsContainer[i];
      const tagIconContainer = event.target;
      const extensionDetailBlock2 = document.getElementById(
        "rs-extension-detail-block2"
      );
      const transparentExtBlock = document.querySelector(
        ".transparent-rs-extension-detail-block"
      );

      const rectTagIcon = tagIconContainer.getBoundingClientRect();
      const rectExtensionBody = extensionDetailBlock2.getBoundingClientRect();

      const top =
        rectTagIcon.top - rectExtensionBody.top - tagIconContainer.offsetHeight;

      transparentExtBlock.style.display = "flex";
      portfolioTagsContainer.style.position = "absolute";
      portfolioTagsContainer.style.top = top + "px";
      portfolioTagsContainer.style.display = "flex";
    },

    hideTags(i) {
      this.$refs.portfolioTagsContainer[i].style.display = "none";
      const transparentExtBlock = document.querySelector(
        ".transparent-rs-extension-detail-block"
      );
      // set the display of class to none if the mouse leaves
      transparentExtBlock.style.display = "none";
    },
    showPreview(portfolio) {
      this.$emit("displayThePreview", portfolio);
      this.updateTypeHandler(this.type);
    },
  },
};
</script>

<style scoped>
.rs-disabled {
  pointer-events: none;
}

@import "../assets/styles/extensionMenu.css";
</style>
