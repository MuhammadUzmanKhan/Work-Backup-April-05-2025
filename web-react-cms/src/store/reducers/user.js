import { createSlice } from '@reduxjs/toolkit';
import {
  signIn,
  signUp,
  forgotPassword,
  forgotPasswordSubmit,
  updateUserAttributes,
  confirmSignUp,
  userSignOut,
  getUsers,
  getUserById
} from 'store/actions/user'

const initialState = {
  user: {},
  users: [],
  listLoading: false,
  email: '',
  loading: false,
  tempPassword: '',
  deadlineStart: false,
  error: '',
  errorCode: '',
  forgotPasswordResp: null,
  isChangedPassword: false,
  isRegistered: false,
  isLoggedIn: false
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserData: (state, { payload }) => {
      state.user = payload
    },
    setLoading: (state, { payload }) => {
      state.loading = payload
    },
    setTempPassword: (state, { payload }) => {
      state.tempPassword = payload
    },
    setStateValue(state, { payload }) {
      return {
        ...state,
        [payload.type]: payload.data
      }
    }
  },
  extraReducers: {
    [signIn.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [signIn.fulfilled]: (state, { payload }) => {
      state.user = payload
      state.email = payload.attributes?.email
      state.tempPassword = payload.password
      state.loading = false
    },
    [signIn.rejected]: (state, { payload }) => {
      state.loading = false
      state.errorCode = payload.code
      state.email = payload.email
    },
    [signUp.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [signUp.fulfilled]: (state, { payload }) => {
      state.user = payload.user
      state.email = payload.user.username
      state.tempPassword = payload.password
      state.loading = false
    },
    [signUp.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload.message
      state.errorCode = payload.code
    },
    [forgotPassword.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [forgotPassword.fulfilled]: (state, { payload }) => {
      state.forgotPasswordResp = payload.CodeDeliveryDetails
      state.loading = false
    },
    [forgotPassword.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [forgotPasswordSubmit.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [forgotPasswordSubmit.fulfilled]: (state) => {
      state.isChangedPassword = true
      state.loading = false
    },
    [forgotPasswordSubmit.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [updateUserAttributes.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [updateUserAttributes.fulfilled]: (state) => {
      state.isUpdated = true
      state.loading = false
    },
    [updateUserAttributes.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [confirmSignUp.pending]: (state) => {
      state.isRegistered = false
      state.loading = true
      state.error = null
    },
    [confirmSignUp.fulfilled]: (state) => {
      state.isRegistered = true
      state.loading = false
    },
    [confirmSignUp.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [userSignOut.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [userSignOut.fulfilled]: (state, { payload }) => {
      state.user = payload
      state.loading = false
    },
    [userSignOut.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [getUsers.pending]: (state) => {
      state.listLoading = true
      state.error = null
    },
    [getUsers.fulfilled]: (state, { payload }) => {
      state.users = payload
      state.listLoading = false
    },
    [getUsers.rejected]: (state, { payload }) => {
      state.listLoading = false
      state.error = payload
    },
    [getUserById.pending]: (state) => {
      state.listLoading = true
      state.error = null
    },
    [getUserById.fulfilled]: (state, { payload }) => {
      state.user = payload
      state.listLoading = false
    },
    [getUserById.rejected]: (state, { payload }) => {
      state.listLoading = false
      state.error = payload
    }
  }
})
export const selectUser = (state) => state.user;

export const { setUserData, setLoading, setTempPassword, setStateValue } = userSlice.actions;

export default userSlice.reducer;
