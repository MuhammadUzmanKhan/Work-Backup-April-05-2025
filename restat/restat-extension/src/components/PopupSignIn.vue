<template>
    <div class="rs-card-main-signin">
      <strong class="rs-mtb-10">Success!</strong>
      <div>Thank you! You have successfully completed the installation. Please reload Upwork & Linkedin pages and sign
        in to continue.</div>
      <form class="rs-mtb-10" @submit.prevent="onLogin">
        <div class="rs-custom-field-div">
          <a-input class="rs-custom-field-input" type="text" placeholder="User Name" v-model:value="theEmail" />
        </div>
        <div class="rs-custom-field-div">
          <a-input class="rs-custom-field-input" type="password" placeholder="Password" v-model:value="thePassword" />
        </div>
        <p v-if="hasTheError" class="rs-errorMsg">* {{ theErrorMessage }}</p>
        <a-button class="rs-sign-in" block @click.stop="onLogin" :loading="theSignInLoading">
          <span v-if="!theSignInLoading">Sign In</span>
        </a-button>
      </form>
    </div>
</template>

<script>
import { Input, Button } from "ant-design-vue";
export default {
  name: "popupSignIn",
  components: {
    'a-button': Button,
    'a-input': Input
  },
  props: ['email', 'password', 'hasError', 'errorMessage', 'signInLoading'],
  emits: ["login"],
  data() {
    return {
      theEmail: "",
      thePassword: "",
      hasTheError: false,
      theErrorMessage: "",
      theSignInLoading: false
    }
},
methods: {
    onLogin() {
        this.$emit('login')
    }
},
mounted() {
    this.theEmail = this.email;
    this.thePassword = this.password;
    this.hasTheError = this.hasError;
    this.theErrorMessage = this.errorMessage;
    this.theSignInLoading = this.signInLoading
}
}
</script>