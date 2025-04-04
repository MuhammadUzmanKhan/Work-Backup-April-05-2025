import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Auth } from 'aws-amplify';

const initialState = {
  user: {},
  loading: true,
  tempPassword: '',
  deadlineStart: false
};

export const signIn = createAsyncThunk('user/signIn', async (value) => {
  try {
    const data = await Auth.signIn(value.email, value.password);
    console.log('signIn___', data);
    return data;
    // dispatch(setUserData(data));
  } catch (e) {
    console.error(e)
    console.dir(e)
    // alert(e.code, JSON.stringify(e, null, 4));
    // switch (e.code) {
    // "NotAuthorizedException"
    //   case 'UserNotConfirmedException':
    //     // dispatch(resendConfirmationCode(value.email));
    //     throw e;
    // }
    // throw { message: e.message, msg: e.response?.data?.message || '' };
  }
  return value;
});

export const signUp = createAsyncThunk('user/signUp', async ({ email, password }, { dispatch }) => {
  try {
    console.log('payload', { email, password });
    const data = await Auth.signUp({
      username: email,
      password,
      attributes: {
        email,
        name: ''
      }
    });
    dispatch(setUserData(data));
  } catch (e) {
    console.error(e);
    console.dir(e);
    throw { message: e.message, msg: e.response?.data?.message || '' }
  }
  return { email, password };
});

export const resendConfirmationCode = createAsyncThunk(
  'user/resendConfirmationCode',
  async (email, { dispatch }) => {
    try {
      console.log('payload', email);
      dispatch(setUserData({ email }));

      const data = await Auth.resendSignUp(email);
      console.log('data', data);
    } catch (e) {
      console.error(e);
      console.dir(e);
      throw { message: e.message, msg: e.response?.data?.message || '' }
    }
    return email;
  }
);

export const forgotPassword = createAsyncThunk(
  'user/forgotPassword',
  async (value, { dispatch }) => {
    try {
      console.log('payload', value);
      const data = await Auth.forgotPassword(value);
      console.log(data);
      dispatch(setUserData({ email: value }));
      return data;
    } catch (e) {
      console.error(e);
      throw { message: e.message, msg: e.response?.data?.message || '' }
    }
  }
);

export const verifyCurrentUserAttributeSubmit = createAsyncThunk(
  'user/verifyCurrentUserAttributeSubmit',
  async (value) => {
    try {
      console.log('payload', value);
      const data = await Auth.verifyCurrentUserAttributeSubmit(value.value, value.attribute);
      console.log(data);
      // dispatch(setUserData({ [value]: value }));
    } catch (e) {
      console.error(e);
      throw { message: e.message, msg: e.response?.data?.message || '' }
    }
    return value;
  }
);

export const updateUserAttributes = createAsyncThunk('user/updateUserAttributes', async (value) => {
  try {
    console.log('payload', value);
    const data = await Auth.updateUserAttributes(value.user, value.attributes);
    console.log(data);
    // dispatch(setUserData({ [value]: value }));
  } catch (e) {
    console.error(e);
    throw { message: e.message, msg: e.response?.data?.message || '' }
  }
  return value;
});

export const forgotPasswordSubmit = createAsyncThunk(
  'user/forgotPasswordSubmit',
  async (value, { dispatch }) => {
    try {
      console.log('payload', value);
      const data = await Auth.forgotPasswordSubmit(value.email, value.code, value.new_password);
      console.log(data);
      dispatch(setUserData(data));
    } catch (e) {
      console.error(e);
      throw { message: e.message, msg: e.response?.data?.message || '' }
    }
    return value;
  }
);

// export const currentAuthenticatedUser = createAsyncThunk(
//   'user/currentAuthenticatedUser',
//   async (value, { dispatch }) => {
//     try {
//       console.log('payload', value);
//       dispatch(setLoading(true));
//       const data = await Auth.currentAuthenticatedUser();

//       dispatch(setUserData(data));
//       dispatch(setLoading(false));
//       return data;
//     } catch (e) {
//       console.error(e);
//       dispatch(setLoading(false));
//       throw { message: e.message, msg: e.response?.data?.message || '' };
//     }
//   }
// );

export const confirmSignUp = createAsyncThunk('user/confirmSignUp', async (value, { dispatch }) => {
  try {
    console.log('payload', value);
    const data = await Auth.confirmSignUp(value.email, value.code);
    console.log(data);
    dispatch(setUserData(data));
  } catch (e) {
    console.error(e);
    throw { message: e.message, msg: e.response?.data?.message || '' }
  }
  return value;
});

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserData: (state, { payload }) => {
      state.user = payload;
    },
    setLoading: (state, { payload }) => {
      state.loading = payload;
    },
    setTempPassword: (state, { payload }) => {
      state.tempPassword = payload;
    },
    setStateValue(state, { payload }) {
      return {
        ...state,
        [payload.type]: payload.data
      };
    }
  }
});
export const selectUser = (state) => state.user;

export const { setUserData, setLoading, setTempPassword, setStateValue } = userSlice.actions;

export default userSlice.reducer;
