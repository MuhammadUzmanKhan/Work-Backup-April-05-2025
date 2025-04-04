<template>
  <div class="rs-preview-detail-block">
    <div class="rs-preview-detail-head">
      <span><strong>{{ type }} Details</strong> - View {{ type }} details
        here</span>
      <CloseOutlined @click="previewClosed" style="font-size: 12px; color: white;" />
    </div>
    <div class="rs-preview-detail-body">
      <div class="rs-close-button-div">
        <div class="mb-3">
          <label class="rs-checkbox-container-preview">
            {{ portfolio.name }}
            <input type="checkbox" :checked="isCheckedLabel" class="rs-disable" />

            <span class="rs-checkmark-label-preview rs-disable"></span>
          </label>
        </div>
        <div v-if="portfolio.links">
          <div class="mb-1"><strong>Attachments</strong></div>
          <div v-for="(link, index) in portfolio.links" :key="link.id">
            <div class="mb-1">
              <label class="rs-checkbox-container-preview">
                {{ link.title }}
                <input type="checkbox" :checked="isCheckedLink[index]?.checked" @input="clickLink(link)" />

                <span class="rs-checkmark-label-preview"></span>
              </label>
              <div class="rs-link">{{ link.url }}</div>
            </div>
          </div>
        </div>
        <div v-if="portfolio.tags">
          <div class="mt-3"><strong>Tags</strong></div>
          <div class="rs-container-of-tags mt-2">
            <div v-for="(tag, i) in portfolio.tags" :key="i" class="rs-tags-tag">
              {{ tag.name }}
            </div>
          </div>
        </div>
        <hr class="rs-hr" />
        <div class="rs-mt-10">
          <strong> {{ type }} Description</strong>
        </div>
        <pre class="rs-description" v-html="formattedDescription"></pre>
      </div>
      <a-button @click="previewClosed" class="rs-close-button rs-bottom-right">
        Close
      </a-button>
    </div>
  </div>
</template>

<script>
import { CloseOutlined } from '@ant-design/icons-vue';
import { Button } from "ant-design-vue";

export default {
  name: "PreviewComponent",
  components: {
    CloseOutlined,
    'a-button': Button
  },
  props: ["selectedPortfolios", "portfolio"],
  emits: ["closeThePreview", "onClickLink"],
  data() {
    return {
      type: "",
      isCheckedLabel: false,
      isCheckedLink: [],
      portfolioDescription: "",
    };
  },
  computed: {
    formattedDescription() {
      if (this.portfolioDescription) {
        return this.portfolioDescription.replace(/\n/g, "<br>");
      }
      return ""
    },
  },
  methods: {
    previewClosed() {
      this.$emit("closeThePreview");
    },
    clickLink(link) {
      if (
        this.selectedPortfolios &&
        this.selectedPortfolios.some((project) => {
          return project.name === this.portfolio.name;
        })
      ) {
        this.isCheckedLink.forEach((linkChecked) => {
          if (linkChecked.id === link.id && !linkChecked.checked) {
            return (linkChecked.checked = true);
          } else if (linkChecked.id === link.id && linkChecked.checked) {
            return (linkChecked.checked = false);
          }
        });
        this.portfolio.links.forEach((portfolioLink) => {
          this.isCheckedLink.forEach((linkChecked) => {
            if (portfolioLink.id === link.id && link.id === linkChecked.id) {
              return (portfolioLink.checked = linkChecked.checked);
            }
            return portfolioLink.checked;
          });
        });
        this.$emit("onClickLink", this.portfolio);
      }
    },
  },
  mounted() {
    this.type = this.$store.state.type.type;
    this.isCheckedLabel = this.selectedPortfolios.some((project) => {
      return project.name === this.portfolio.name;
    });
    this.portfolio.links?.forEach((portfolioLink) =>
      this.isCheckedLink.push({
        id: portfolioLink.id,
        checked: portfolioLink.checked,
      })
    );
    this.portfolioDescription = this.portfolio.description;
  },
};
</script>

<style scoped>
.rs-hr {
  color: #28303f;
  opacity: 1;
  margin: 0.5rem 1rem 0;
}

.rs-link {
  text-decoration: underline;
  padding-left: 1.5rem;
}

.rs-disable {
  pointer-events: none;
}

.rs-description {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.rs-mt-10 {
  margin-top: 10px;
}
</style>
