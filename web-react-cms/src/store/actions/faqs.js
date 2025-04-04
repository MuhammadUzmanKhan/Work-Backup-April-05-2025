import { createAsyncThunk } from '@reduxjs/toolkit';
import { failureToast } from 'utils';
import FaqsService from '../../services/FaqsService'

export const getFaqs = createAsyncThunk('experts/getFaqs', async (params, thunkAPI) => {
  try {
    const response = await FaqsService.getDataList({ params })
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    return thunkAPI.rejectWithValue(err.message.original)
  }
})

export const getFaqById = createAsyncThunk('faqs/getFaqById', async (params, thunkAPI) => {
  try {
    const response = await FaqsService.getDataById({ params })
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    return thunkAPI.rejectWithValue(err.message)
  }
})

export const updateFaqByExpert = createAsyncThunk(
  'faqs/updateFaqByExpert',
  async (params, thunkAPI) => {
    try {
      const response = await FaqsService.editDataById({ params })
      if (params.cb) params.cb(response)
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      failureToast(`Faq could not be updated.  ${err.msg}`)
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)

export const createFaq = createAsyncThunk('faqs/createFaq', async (params, thunkAPI) => {
  try {
    const response = await FaqsService.postData({ params: params.params })
    if (params.cb) params.cb(response)
    return response
  } catch (err) {
    if (!err.message) {
      console.log(err.message)
      throw err
    }
    failureToast(`Faq could not be created.  ${err.msg}`)

    return thunkAPI.rejectWithValue(err.message.original)
  }
})

export const deleteFaq = createAsyncThunk('faqs/deleteFaq', async (params, thunkAPI) => {
  try {
    const response = await FaqsService.deleteDataById({ params })
    if (params.cb) params.cb()
    return response
  } catch (err) {
    if (!err.message) {
      console.log(err.message)
      throw err
    }
    failureToast(`Faq could not be deleted.  ${err.msg}`)
    if (params.cbf) params.cbf()

    return thunkAPI.rejectWithValue(err.message.original)
  }
})
