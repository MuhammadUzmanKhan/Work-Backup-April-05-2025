import { createAsyncThunk } from '@reduxjs/toolkit';
import { failureToast } from 'utils'
import ProductProvider from '../../services/ProductProviderService'

export const fetchPartners = createAsyncThunk(
  'partners/fetchPartners',
  async (params, thunkAPI) => {
    try {
      const response = await ProductProvider.getDataList({ params })
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message.original)
    }
  }
)

export const fetchPartnerById = createAsyncThunk(
  'partners/fetchPartnerById',
  async (params, thunkAPI) => {
    try {
      const response = await ProductProvider.getDataById({ params })
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)

export const setPartner = createAsyncThunk(
  'products/setProductCategorys',
  async (params, thunkAPI) => {
    try {
      const response = await ProductProvider.postData({ params: params.params })
      if (params.cb) params.cb(response)
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      failureToast(`Partner could not be created.  ${err.msg}`)

      return thunkAPI.rejectWithValue(err.message.original)
    }
  }
)

export const editPartner = createAsyncThunk('products/editPartner', async (params, thunkAPI) => {
  try {
    const response = await ProductProvider.editDataById({ params })
    if (params.cb) params.cb(response)
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    failureToast(`Partner could not be updated.  ${err.msg}`)

    return thunkAPI.rejectWithValue(err.message.original)
  }
})
export const publishPartner = createAsyncThunk(
  'products/publishPartner',
  async (params, thunkAPI) => {
    try {
      const response = await ProductProvider.editDataById({ params })
      if (params.cb) params.cb(response)
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      failureToast(`Partner could not be updated.  ${err.msg}`)
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)

export const fetchPartnerLinksById = createAsyncThunk(
  'partners/fetchPartnerLinksById',
  async (params, thunkAPI) => {
    try {
      const response = await ProductProvider.getDataById({ params })
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)

export const deletePartner = createAsyncThunk(
  'products/deletePartner',
  async (params, thunkAPI) => {
    try {
      const response = await ProductProvider.deleteDataById({ params })
      if (params.cb) params.cb()
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      failureToast(`Partner could not be deleted.  ${err.msg}`)
      if (params.cbf) params.cbf()
      return thunkAPI.rejectWithValue(err.message.original)
    }
  }
)