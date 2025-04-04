import { createStore } from "vuex";
import tags from "./modules/tags"; // Import your modules
import projects from "./modules/projects"
import templates from "./modules/templates"
import links from "./modules/links"
import type from "./modules/type"
import templateContent from  "./modules/templateContent"
import industries from "./modules/industries"
import linkedinProfiles from "./modules/linkedinProfiles";
import upworkProfiles from "./modules/upworkProfiles"
import countBids from "./modules/countBids"
import countLinkedinConnects from "./modules/countLinkedinConnects";
import caseStudies from "./modules/caseStudies"
import loading from "./modules/loading"
import currentView from "./modules/currentView"
export default createStore({
  modules: {
    // Include your modules here
    tags, 
    projects,
    templates,
    type,
    links,
    templateContent,
    industries,
    linkedinProfiles,
    upworkProfiles,
    countBids,
    countLinkedinConnects,
    caseStudies,
    loading,
    currentView
  },
});

