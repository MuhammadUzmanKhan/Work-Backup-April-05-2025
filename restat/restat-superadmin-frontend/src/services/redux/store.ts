import { configureStore, createAction } from '@reduxjs/toolkit'
import { userReducer, } from './features'
import { RESET_STORE } from '../constants';


export const store = configureStore({
  reducer: {
    user: userReducer,
  },
})


export const resetStore = createAction(RESET_STORE);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch