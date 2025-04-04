<template>
  <div class="rs-extension-detail-head">
    <span><strong>Preview</strong> - View your bid here</span>
  </div>
  <div class="rs-bid-preview-detail-body">
    <div v-if="!templateContent" class="rs-empty-message">
      <InfoCircleOutlined style="font-size: 50px; color: #ffffff" />
      <div class="mt-5">Kindly select a template to continue</div>
    </div>
    <textarea
      v-else
      class="rs-template-content"
      cols="20"
      rows="40"
      v-model="templateContent"
    ></textarea>
    <div class="rs-button-container">
      <a-button @click="goBack" class="rs-done-button">Back</a-button>
      <a-button
        class="rs-save-button"
        @click="clickSave"
        :class="{ 'rs-disabled-class': templateContent === '' }"
        :disabled="templateContent === ''"
      >
        Save
      </a-button>
      <a-button
        class="rs-done-button"
        @click="done"
        :class="{ 'rs-disabled-class': templateContent === '' }"
        :disabled="templateContent === ''"
      >
        Done
      </a-button>
    </div>
    <div v-if="openModal" @click="stopPropagation">
      <SaveTemplateModal
        :templateTitle="templateTitle"
        :tags="tags"
        :success="success"
        :error="error"
        :noTagsError="noTagsError"
        :successMessage="successMessage"
        :errorMessage="errorMessage"
        :noTagsErrorMessage="noTagsErrorMessage"
        @closeTheModal="closeModal"
        @updateTemplateTitle="updateTemplateTitle"
        @handleTagClicked="handleTagClicked($event)"
        @removeTag="removeTag($event)"
        @saveTemplate="saveTemplate"
      />
    </div>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import SaveTemplateModal from "./SaveTemplateModal.vue";
import { createTemplate } from "@/provider";
import { PORTFOLIO_TYPE } from "@/utility/portfolioType";
import { handleRuntimeMessage } from "@/utility/parserHelper";
import { MESSAGES } from "@/constants";
import { InfoCircleOutlined } from "@ant-design/icons-vue";
import { Button } from "ant-design-vue";

export default {
  name: "BidPreview",
  props: ["openBidPreview"],
  emits: ["setTheOpenBidPreview", "goToBack", "closeExtensionWhenDone"],
  components: { SaveTemplateModal, InfoCircleOutlined, "a-button": Button },
  data() {
    return {
      templateContent: "",
      templateTitle: "",
      openModal: false,
      tags: [],
      success: false,
      error: false,
      noTagsError: false,
      successMessage: "",
      errorMessage: "",
      noTagsErrorMessage: "",
    };
  },
  methods: {
    ...mapActions("templateContent", ["updateTemplateContent"]),
    updateTemplateTitle(newTitle) {
      // if error is true then make it false as we are updating the name of the template, so it no longer appears while changing the name.
      if (this.error) {
        this.error = false;
      }
      this.templateTitle = newTitle;
    },
    insertContent(selectedItems, placeholder, heading) {
      let index = 0;
      if (selectedItems.length) {
        let headingPresent = this.templateContent.includes(heading);
        selectedItems.forEach((item, i) => {
          if (!this.templateContent.includes(item.name)) {
            index = this.templateContent.indexOf(placeholder);
            const index2 = this.templateContent.indexOf(heading);
            if (index !== -1) {
              this.templateContent =
                this.templateContent.substring(0, index) +
                `${
                  !this.templateContent.includes(`${heading}\n`) ? `\n${heading}\n` : ""
                }- ${item.name} ${item.description ? `(${item.description})` : ""} ${
                  item.links
                    ? item.links
                        ?.map((link) => {
                          return link.checked && link.title
                            ? `(${link.title}: ${link.url})`
                            : link.checked && `(${link.url})`;
                        })
                        .filter(Boolean)
                        .join(", ")
                    : ""
                } \n` +
                this.templateContent.substring(index, this.templateContent.length);
            } else if (index2 !== -1 && headingPresent) {
              const headingEnd = index2 + heading.length;
              this.templateContent =
                this.templateContent.substring(0, headingEnd) +
                `${i === selectedItems.length - 1 ? "\n" : ""} - ${item.name} ${
                  item.description ? `(${item.description})` : ""
                } ${
                  item.links
                    ? item.links
                        ?.map((link) => {
                          return link.checked && link.title
                            ? `(${link.title}: ${link.url})`
                            : link.checked && `(${link.url})`;
                        })
                        .filter(Boolean)
                        .join(", ")
                    : ""
                }  ${i !== 0 ? "\n" : ""}` +
                this.templateContent.substring(headingEnd, this.templateContent.length);
            } else {
              this.templateContent =
                this.templateContent.substring(index, this.templateContent.length) +
                this.templateContent.substring(0, index) +
                `${
                  !this.templateContent.includes(`${heading}\n`) ? `\n${heading}\n` : ""
                }- ${item.name} ${item.description ? `(${item.description})` : ""} ${
                  item.links
                    ? item.links
                        ?.map((link) => {
                          return link.checked && link.title
                            ? `(${link.title}: ${link.url})`
                            : link.checked && `(${link.url})`;
                        })
                        .filter(Boolean)
                        .join(", ")
                    : ""
                } \n`;
            }
          }
        });
      }
    },
    setTemplateContent() {
      this.tags = this.$store.state.tags.suggestedTags;
      const selectedTemplate = this.$store.state.templates.selectedTemplate;
      // empty the template content and template title
      this.templateContent = "";
      this.templateTitle = "";
      const selectedProjects = this.$store.state.projects.selectedProjects;

      const selectedLinks = this.$store.state.links.selectedLinks;
      const selectedCaseStudies = this.$store.state.caseStudies.selectedCaseStudies;
      if (selectedTemplate.length) {
        this.templateContent = selectedTemplate[0].description;
        const phrases = ["Let's discuss", "Regards"];
        let foundIndex = -1;
        // Check for each phrase in a case insensitive manner
        for (const phrase of phrases) {
          const regex = new RegExp(phrase, "i");
          const match = this.templateContent.search(regex);
          if (match !== -1) {
            foundIndex = match;
            break;
          }
        }
        let restOfTemplateContent = "";
        // Split the template based on the found index
        if (foundIndex !== -1) {
          const templateContent = this.templateContent.substring(0, foundIndex);
          restOfTemplateContent = "\n" + this.templateContent.substring(foundIndex);
          this.templateContent = templateContent;
        }

        this.insertContent(selectedProjects, "{{project}}", "Projects");
        this.insertContent(selectedCaseStudies, "{{caseStudy}}", "Case Studies");
        this.insertContent(selectedLinks, "{{link}}", "Links");

        this.templateContent = this.templateContent + restOfTemplateContent;
      }
    },
    iconClick() {
      this.$emit("setTheOpenBidPreview");
      if (!this.openBidPreview) {
        this.setTemplateContent();
      }
    },
    updateTemplateContentHandler(templateContent) {
      this.updateTemplateContent(templateContent);
    },
    done() {
      if (this.templateContent !== "") {
        this.updateTemplateContentHandler(this.templateContent);
        handleRuntimeMessage({
          message: MESSAGES.ADD_COVER_LETTER_TEMPLATE,
          template: this.templateContent,
        });
        this.$emit("closeExtensionWhenDone");
      }
    },
    clickSave(event) {
      if (this.templateContent !== "") {
        event.stopPropagation();
        this.openModal = true;
        this.success = false;
        this.error = false;
      }
    },
    async saveTemplate() {
      if (this.tags.length === 0) {
        this.noTagsError = true;
        this.noTagsErrorMessage = "Please select atleast one tag!";
      } else {
        const data = await createTemplate({
          name: this.templateTitle,
          type: PORTFOLIO_TYPE.TEMPLATE,
          description: this.templateContent,
          tags: this.tags,
        });
        if (data.message) {
          this.success = true;
          this.successMessage = "Template created successfully!";
          // close the modal after 1.5 seconds of successfully creating the template
          setTimeout(() => {
            this.openModal = false;
          }, 1500);
        }
        if (data.error) {
          this.error = true;
          if (data.error.message === "Conflict") {
            this.errorMessage = "The specified template name already exists!";
          } else {
            this.errorMessage = "Something went wrong while creating the template!";
          }
        }
      }
    },
    closeModal() {
      if (this.openModal) {
        this.openModal = false;
      }
    },
    // to stop the propagation of main close event on the child component
    stopPropagation(event) {
      event.stopPropagation();
    },
    pushTag(tag) {
      // if noTagsError message is true, make it false
      if (this.noTagsError) {
        this.noTagsError = false;
      }
      this.tags.push(tag);
    },
    handleTagClicked(tagToAdd) {
      if (!this.tags.some((tag) => tag.name === tagToAdd.name)) {
        this.pushTag(tagToAdd);
      }
    },
    removeTag(tagToRemove) {
      if (this.tags.length) {
        this.tags = this.tags.filter((tag) => tag.name !== tagToRemove.name);
      }
    },
    goBack() {
      this.$emit("goToBack");
    },
  },
  watch: {
    "$store.state.templates.selectedTemplate": {
      handler() {
        this.setTemplateContent();
      },
      deep: true,
    },
    "$store.state.projects.selectedProjects": {
      handler() {
        this.setTemplateContent();
      },
      deep: true,
    },
    "$store.state.caseStudies.selectedCaseStudies": {
      handler() {
        this.setTemplateContent();
      },
      deep: true,
    },
    "$store.state.links.selectedLinks": {
      handler() {
        this.setTemplateContent();
      },
      deep: true,
    },
  },
  async mounted() {
    this.setTemplateContent();
  },
};
</script>
<style>
.rs-disabled-class {
  cursor: not-allowed !important;
  opacity: 0.5;
}

.rs-empty-message {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 70vh;
}

@import "../assets/styles/extensionMenu.css";
</style>
@/utility/parserHelper
