import { configureStore, createAction } from '@reduxjs/toolkit'
import {
  bidReducer,
  portfolioReducer,
  tagsReducer,
  userReducer,
  companyUsersReducer,
  companyReducer,
  bidderBidsReducer,
  contactsReducer,
  companyAllUsersReducer,
  companyAllUpworkProfilesReducer,
  companyUpworkProfilesReducer,
  dealsReducer,
  jobsReducer,
  leadsReducer,
  linkedinConnectsReducer,
  linkedinReducer,
  configurationsReducer,
  industriesReducer,
  companiesReducer,
  pageHeaderReducer,
  filterReducer
} from './features'
import { RESET_STORE } from '../constants';


export const store = configureStore({
  reducer: {
    user: userReducer,
    tags: tagsReducer,
    portfolios: portfolioReducer,
    bids: bidReducer,
    companyUsers: companyUsersReducer,
    company: companyReducer,
    bidderBids: bidderBidsReducer,
    linkedinCounts: linkedinConnectsReducer,
    contacts: contactsReducer,
    companyAllUsers: companyAllUsersReducer,
    companyAllUpworkProfiles: companyAllUpworkProfilesReducer,
    companyUpworkProfiles: companyUpworkProfilesReducer,
    deals: dealsReducer,
    jobs: jobsReducer,
    leads: leadsReducer,
    linkedin: linkedinReducer,
    configuration: configurationsReducer,
    industies: industriesReducer,
    companies: companiesReducer,
    pageHeader: pageHeaderReducer,
    filters: filterReducer,
  },
})


export const resetStore = createAction(RESET_STORE);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch