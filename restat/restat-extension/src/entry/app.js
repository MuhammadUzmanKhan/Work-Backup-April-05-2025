
import { createApp } from "vue";
import RollbarPlugin from '../rollbar';
// import router from "./router"; // Import your Vue Router configuration
import store from "../store"; // Import the Vuex store
import App from '../view/app.vue';

const app = createApp(App);
app.use(RollbarPlugin);
createApp(App).use(store).mount('#app');