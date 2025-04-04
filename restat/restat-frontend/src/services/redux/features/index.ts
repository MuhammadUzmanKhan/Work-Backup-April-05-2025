import userReducer from './user/user-slice';
import tagsReducer from './tags/tags-slice';
import portfolioReducer from './portfolios/portfolios.slice'
import bidReducer from "./bids/bids.slice"
import companyUsersReducer from "./company-users/users.slice"
import companyAllUsersReducer from "./all-company-users/all-company-users.slice"
import companyReducer from "./company/company-slice"
import bidderBidsReducer from "./bidder-bids-count/bidder-bids-count-slice"
import linkedinConnectsReducer from "./bidder-bids-count/linkedin-connects-count-slice"
import contactsReducer from "./contacts/contacts-slice"
import companyAllUpworkProfilesReducer from './all-upwork-profiles/profiles.slice'
import companyUpworkProfilesReducer from './company-upwork-profiles/upwork-profiles.slice'
import dealsReducer from "./deals/deal.slice"
import jobsReducer from "./jobs/jobs.slice"
import leadsReducer from "./leads/leads.slice"
import linkedinReducer from './linkedin/linkedin.slice';
import configurationsReducer from './configurations/configurations-slice'
import industriesReducer from './industries/industries.slice';
import companiesReducer from './companies/companies-slice';
import pageHeaderReducer from './page-header/page-header.slice';
import filterReducer from './page-header/filter.slice';

export {
  userReducer,
  tagsReducer,
  portfolioReducer,
  bidReducer,
  companyUsersReducer,
  companyReducer,
  bidderBidsReducer,
  linkedinConnectsReducer,
  contactsReducer,
  companyAllUsersReducer,
  companyAllUpworkProfilesReducer,
  companyUpworkProfilesReducer,
  dealsReducer,
  jobsReducer,
  leadsReducer,
  linkedinReducer,
  configurationsReducer,
  industriesReducer,
  companiesReducer,
  pageHeaderReducer,
  filterReducer,
}
