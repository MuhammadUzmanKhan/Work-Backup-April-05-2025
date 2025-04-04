import { createAsyncThunk } from '@reduxjs/toolkit';
import { Auth } from 'aws-amplify';
import UsersService from 'services/UsersService';
import { failureToast, getErrorStringPart } from 'utils'

export const signIn = createAsyncThunk('user/signIn', async (value, thunkAPI) => {
  try {
    const data = await Auth.signIn(value.email, value.password)
    return data
  } catch (err) {
    if (!err.message) {
      throw err
      // throw new Error(err);
    }
    if (err.code) {
      return thunkAPI.rejectWithValue({ code: err.code, email: value.email })
    }
    return thunkAPI.rejectWithValue(err)
  }
})

export const signUp = createAsyncThunk('user/signUp', async ({ email, password }, thunkAPI) => {
  try {
    const data = await Auth.signUp({
      username: email,
      password,
      attributes: {
        email,
        name: ''
      }
    })
    return data
  } catch (err) {
    if (!err.message) {
      throw err
      // throw new Error(err);
    }

    return thunkAPI.rejectWithValue(err)
  }
})

export const signOut = createAsyncThunk('user/signOut', async (_, thunkAPI) => {
  try {
    const data = await Auth.signOut()
    return data
  } catch (err) {
    if (!err.message) {
      throw err
      // throw new Error(err);
    }
    if (err.message) {
      return thunkAPI.rejectWithValue(err.message)
    }
    return thunkAPI.rejectWithValue(err)
  }
})

export const forgotPassword = createAsyncThunk('user/forgotPassword', async (value, thunkAPI) => {
  try {
    const data = await Auth.forgotPassword(value)
    return data
  } catch (err) {
    if (!err.message) {
      throw err
    }
    if (err.message) {
      return thunkAPI.rejectWithValue(err.message)
    }
    return thunkAPI.rejectWithValue(err)
  }
})

export const forgotPasswordSubmit = createAsyncThunk(
  'user/forgotPasswordSubmit',
  async (value, thunkAPI) => {
    try {
      const data = await Auth.forgotPasswordSubmit(value.email, value.code, value.new_password)
      return data
    } catch (err) {
      if (!err.message) {
        throw err
      }
      if (err.message) {
        return thunkAPI.rejectWithValue(err.message)
      }
      return thunkAPI.rejectWithValue(err)
    }
  }
)
//== is not used yet
export const verifyCurrentUserAttributeSubmit = createAsyncThunk(
  'user/verifyCurrentUserAttributeSubmit',
  async (value) => {
    try {
      console.log('verifyCurrentUserAttributeSubmit', value)
      const data = await Auth.verifyCurrentUserAttributeSubmit(value.value, value.attribute)
      console.log(data)
      // dispatch(setUserData({ [value]: value }));
    } catch (e) {
      console.error(e)
      throw {
        message: e.message,
        msg: e.response?.data?.errors
          ? getErrorStringPart(e.response?.data?.errors[0])
          : e.response?.data?.message || ''
      }
    }
    return value
  }
)

export const updateUserAttributes = createAsyncThunk(
  'user/updateUserAttributes',
  async (value, thunkAPI) => {
    try {
      const data = await Auth.updateUserAttributes(value.user, value.attributes)
      return data
    } catch (err) {
      if (!err.message) {
        throw err
      }
      if (err.message) {
        return thunkAPI.rejectWithValue(err.message)
      }
      return thunkAPI.rejectWithValue(err)
    }
  }
)

export const currentAuthenticatedUser = async () => {
  try {
    const data = await Auth.currentAuthenticatedUser()
    return data
  } catch (err) {
    return null
  }
}

export const userSignOut = createAsyncThunk('user/userSignOut', async (_, thunkAPI) => {
  try {
    await Auth.signOut()
    return {}
  } catch (err) {
    if (!err.message) {
      throw err
    }
    return thunkAPI.rejectWithValue(err)
  }
})

export const confirmSignUp = createAsyncThunk('user/confirmSignUp', async (value, thunkAPI) => {
  try {
    const data = await Auth.confirmSignUp(value.email, value.code)
    return data
  } catch (err) {
    if (!err.message) {
      throw err
      // throw new Error(err);
    }
    if (err.code) {
      return thunkAPI.rejectWithValue({ code: err.code, email: value.email })
    }
    return thunkAPI.rejectWithValue(err)
  }
})

export const resendConfirmationCode = createAsyncThunk(
  'user/resendConfirmationCode',
  async (email, thunkAPI) => {
    try {
      await Auth.resendSignUp(email)
      return email
    } catch (err) {
      if (!err.message) {
        throw err
      }

      if (err.code) {
        return thunkAPI.rejectWithValue(err.code)
      }
      if (err.message) {
        return thunkAPI.rejectWithValue(err.message)
      }
      return thunkAPI.rejectWithValue(err)
    }
  }
)

export const getUsers = createAsyncThunk('user/getUsers', async (params, thunkAPI) => {
  try {
    const response = await UsersService.getDataList({ params })
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    return thunkAPI.rejectWithValue(err.message.original)
  }
})

export const addUser = createAsyncThunk('user/addUser', async (params, thunkAPI) => {
  try {
    const response = await UsersService.postData({ params: params.params })
    if (params.cb) params.cb(response)
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    return thunkAPI.rejectWithValue(err.message.original)
  }
})

export const editUser = createAsyncThunk('user/editUser', async (params, thunkAPI) => {
  try {
    const response = await UsersService.editDataById({ params })
    if (params.cb) params.cb(response)
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    failureToast('User could not be edit.')
    return thunkAPI.rejectWithValue(err.message)
  }
})

export const getUserById = createAsyncThunk('user/getUserById', async (params, thunkAPI) => {
  try {
    const response = await UsersService.getDataById({ params })
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    return thunkAPI.rejectWithValue(err.message)
  }
})