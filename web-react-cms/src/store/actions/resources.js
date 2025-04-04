import { createAsyncThunk } from '@reduxjs/toolkit';
import { failureToast } from 'utils'
import ResourceProvider from '../../services/ResourceService'

export const getResources = createAsyncThunk('resources/getResources', async (params, thunkAPI) => {
  try {
    const response = await ResourceProvider.getDataList({ params })
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    return thunkAPI.rejectWithValue(err.message.original)
  }
})

export const getResourcesByArabicLang = createAsyncThunk(
  'resources/getResourcesByArabicLang',
  async (params, thunkAPI) => {
    try {
      const response = await ResourceProvider.getDataListByLang({ params })
      if (response?.length) {
        const { resources: { resources } } = thunkAPI.getState()
        return response.map((res) => ({ ...res, type: 'ar' })).filter(ar => !resources.find(eng => eng.id === ar.id))
      }
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message.original)
    }
  }
)


export const getResourceById = createAsyncThunk(
  'resources/getResourceById',
  async (params, thunkAPI) => {
    try {
      const response = await ResourceProvider.getDataById({ params })
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)

export const updateResourceById = createAsyncThunk(
  'resources/updateResourceById',
  async (params, thunkAPI) => {
    try {
      const response = await ResourceProvider.editDataById({ params })
      if (params.cb) params.cb(response)
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      failureToast(`Resource could not be updated.  ${err.msg}`)
      return thunkAPI.rejectWithValue(err.message.original)
    }
  }
)

export const createResource = createAsyncThunk(
  'resources/createResource',
  async (params, thunkAPI) => {
    try {
      const response = await ResourceProvider.postData({ params: params.params });
      if (params.cb) params.cb(response);
      return response;
    } catch (err) {
      if (!err.message) {
        throw err;
      }
      failureToast(`Resource could not be created ${err.msg}`)

      return thunkAPI.rejectWithValue(err.message)
    }
  }
);

export const getResourceLinksById = createAsyncThunk(
  'resources/getResourceLinksById',
  async (params, thunkAPI) => {
    try {
      const response = await ResourceProvider.getDataById({ params })
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)

export const deleteResourceById = createAsyncThunk(
  'resources/deleteResourceById',
  async (params, thunkAPI) => {
    try {
      const response = await ResourceProvider.deleteDataById({ params })
      if (params.cb) params.cb()
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      failureToast(`Resource could not be deleted.  ${err.msg}`)
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)