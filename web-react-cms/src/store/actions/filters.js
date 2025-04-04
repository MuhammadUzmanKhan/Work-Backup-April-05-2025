import { createAsyncThunk } from '@reduxjs/toolkit';
import FilterTagsProductService from 'services/FilterTagsProductService';
import { failureToast } from 'utils';

export const getFilters = createAsyncThunk('filters/getFilters', async (params, thunkAPI) => {
  try {
    const response = await FilterTagsProductService.getDataList({ params });
    return response;
  } catch (err) {
    if (!err.message) {
      throw err;
    }
    return thunkAPI.rejectWithValue(err.message.original);
  }
});

export const getFiltersById = createAsyncThunk(
  'filters/getFiltersById',
  async (params, thunkAPI) => {
    try {
      const response = await FilterTagsProductService.getDataById({ params });
      return response;
    } catch (err) {
      if (!err.message) {
        throw err;
      }
      return thunkAPI.rejectWithValue(err.message.original);
    }
  }
);

export const updateFilter = createAsyncThunk('filters/updateFilter', async (params, thunkAPI) => {
  try {
    const response = await FilterTagsProductService.editDataById({ params })
    return response
  } catch (err) {
    if (!err.message) {
      console.log(err.message)
      throw err
    }
    failureToast(`Filter could not be updated.  ${err.msg}`)

    return thunkAPI.rejectWithValue(err.message.original)
  }
})

export const createFilter = createAsyncThunk('filters/createFilter', async (params, thunkAPI) => {
  try {
    const response = await FilterTagsProductService.postData({ params })
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
