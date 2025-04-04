<template>
  <div class="rs-extension-detail-head">
    <span><strong>AI</strong> - AI Coming Soon</span>
  </div>
  <div class="rs-extension-detail-body" style="position: relative">
    <header class="rs-ai-header">
        <h1 class="rs-rs-heading-area__title-ai">AI Coming Soon</h1>
    </header>
  </div>
</template>

<script>
export default {
  name: "AiComponent",
  data() {
    return {};
  },

  methods: {},
  async mounted() {},
};
</script>

<style>
.rs-ai-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.rs-ai-header {
  display: flex;
  flex-direction: column;
  padding: 15px 20px;
}

.rs-rs-heading-area__title-ai {
  font-size: 22px;
  text-transform: uppercase;
  margin: 0;
  color: white;
}

@import "../assets/styles/extensionMenu.css";
</style>
