import { createAsyncThunk } from '@reduxjs/toolkit';
import ExpertFaqService from 'services/ExpertFaqService';
import ResourceServiceSearch from 'services/ResourceServiceSearch';
import { failureToast } from 'utils'
import ExpertsService from '../../services/ExpertsService'

export const getExperts = createAsyncThunk('experts/getExperts', async (params, thunkAPI) => {
  try {
    const response = await ExpertsService.getDataList({ params })
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    return thunkAPI.rejectWithValue(err.message.original)
  }
})

export const getExpertById = createAsyncThunk('experts/getExpertById', async (params, thunkAPI) => {
  try {
    const response = await ExpertsService.getDataById({ params })
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    return thunkAPI.rejectWithValue(err.message)
  }
})

export const updateExpert = createAsyncThunk('resources/updateExpert', async (params, thunkAPI) => {
  try {
    const response = await ExpertsService.editDataById({ params })
    if (params.cb) params.cb(response)
    return response
  } catch (err) {
    if (!err.message) {
      console.log(err.message)
      throw err
    }
    failureToast(`Expert could not be updated.  ${err.msg}`)
    return thunkAPI.rejectWithValue(err.message)
  }
})

export const createExpert = createAsyncThunk('experts/createExpert', async (params, thunkAPI) => {
  try {
    const response = await ExpertsService.postData({ params: params.params })
    if (params.cb) params.cb(response)

    return response
  } catch (err) {
    if (!err.message) {
      console.log(err.message)
      throw err
    }
    failureToast(`Expert could not be created.  ${err.msg}`)

    return thunkAPI.rejectWithValue(err.message.original)
  }
})

export const getFaqsByExpert = createAsyncThunk(
  'experts/getFaqsByExpert',
  async (params, thunkAPI) => {
    try {
      const response = await ExpertFaqService.postData({ params });
      return response;
    } catch (err) {
      if (!err.message) {
        throw err;
      }
      return thunkAPI.rejectWithValue(err.message.original);
    }
  }
);

export const getResoucesByExpert = createAsyncThunk(
  'experts/getResourcesByExpert',
  async (params, thunkAPI) => {
    try {
      const response = await ResourceServiceSearch.postData({ params });
      return response;
    } catch (err) {
      if (!err.message) {
        throw err;
      }
      return thunkAPI.rejectWithValue(err.message.original);
    }
  }
);

export const getResoucesByExpertByLang = createAsyncThunk(
  'experts/getResourcesByExpertByLang',
  async (params, thunkAPI) => {
    try {
      const response = await ResourceServiceSearch.postDataByLang({ params })
      if (response?.length) {
        return response.map((res) => ({ ...res, type: 'ar' }))
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

export const getExpertsByArabicLang = createAsyncThunk(
  'experts/getExpertsByArabicLang',
  async (params, thunkAPI) => {
    try {
      const response = await ExpertsService.getDataListByLang({ params })
      if (response?.length) {
        const { experts: { experts } } = thunkAPI.getState()
        return response.map((res) => ({ ...res, type: 'ar' })).filter(ar => !experts.find(eng => eng.id === ar.id))
      }
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)


export const deleteExpertById = createAsyncThunk(
  'resources/deleteExpertById',
  async (params, thunkAPI) => {
    try {
      const response = await ExpertsService.deleteDataById({ params })
      if (params.cb) params.cb()
      return response
    } catch (err) {
      if (!err.message) {
        console.log(err.message)
        throw err
      }
      failureToast(`Expert could not be deleted.  ${err.msg}`)
      if (params.cbf) params.cbf()
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)
