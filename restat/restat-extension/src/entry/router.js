// import { createRouter, createWebHashHistory } from 'vue-router';
// import Templates from '../components/Templates.vue';
// import Projects from '../components/Projects.vue';
// import CaseStudies from "../components/CaseStudies.vue"
// import ExtensionMenu from '../view/extensionMenu'
// import GithubLinks from "../components/GithubLinks"
// const routes = [
//   {path: '/', component: ExtensionMenu},
//   { path: '/templates', component: Templates },
//   { path: '/projects', component: Projects },
//   { path: '/caseStudies', component: CaseStudies},
//   { path: '/githubLinks', component: GithubLinks},
//   { path: '/:pathMatch(.*)*', redirect: '/' }, // Catch-all route
// ];

// const router = createRouter({
//   history: createWebHashHistory(),
//   routes,
// });

// // Check if it's a page reload
// if (window.performance.navigation.type === 1) {
//   // If it's a page reload, navigate to the default route
//   router.push({ path: '/' });
// }

// // Global navigation guard
// router.beforeEach((to, from, next) => {
//   // Check if bidder data exists in chrome.storage.sync
//   chrome.storage.sync.get(['bidder'], (result) => {
//     const bidder = result.bidder;
//     if (bidder && bidder.bidder !== '') {
//       // Bidder data exists and is not empty, continue navigation
//       next();
//     }
//   });
// });

// export default router;
