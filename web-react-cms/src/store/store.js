import { configureStore } from '@reduxjs/toolkit';
import appReducer from './app/appSlice';
// import userReducer from './user/userSlice';
import userReducer from './reducers/user';
import productsReducer from './reducers/products';
import dashboardReducer from './reducers/dashboard';
import resourcesReducer from './reducers/resources';
import pointsReducer from './reducers/points';
import partnersReducer from './reducers/partners';
import expertsReducer from './reducers/experts';
import tagsSlice from './reducers/tags';
import rewardsSlice from './reducers/rewards';
import faqSlice from './reducers/faqs';
import quizeSlice from './reducers/quizes';
import filterSlice from './reducers/filters';
import permissionsSlice from './reducers/permissions'
import quizThemesSlice from './reducers/quizThemes'

export const store = configureStore({
  reducer: {
    app: appReducer,
    user: userReducer,
    products: productsReducer,
    dashboard: dashboardReducer,
    resources: resourcesReducer,
    points: pointsReducer,
    partners: partnersReducer,
    experts: expertsReducer,
    tags: tagsSlice,
    faqs: faqSlice,
    rewards: rewardsSlice,
    quizes: quizeSlice,
    filters: filterSlice,
    permissions: permissionsSlice,
    quizThemes: quizThemesSlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})
