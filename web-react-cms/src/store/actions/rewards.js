import { createAsyncThunk } from '@reduxjs/toolkit';
import RewardsService from 'services/RewardsService';
import { failureToast } from 'utils';
import { LANGUAGE_ERROR, PUBLISH_ERROR } from 'utils/constants'

export const postRewards = createAsyncThunk('rewards/postRewards', async (params, thunkAPI) => {
  try {
    const response = await RewardsService.postData({ params: params.params });
    if (params.cb) params.cb(response);
    return response;
  } catch (err) {
    if (!err.message) {
      throw err;
    }
    failureToast(`Reward could not be created ${err.msg}`)

    return thunkAPI.rejectWithValue(err.message)
  }
});

export const getRewards = createAsyncThunk('rewards/getRewards', async (params, thunkAPI) => {
  try {
    const response = await RewardsService.getDataList({ params });
    return response;
  } catch (err) {
    if (!err.message) {
      throw err;
    }
    return thunkAPI.rejectWithValue(err.message.original);
  }
});

export const editRewards = createAsyncThunk('rewards/editRewards', async (params, thunkAPI) => {
  try {
    const response = await RewardsService.editDataById({ params })
    if (params.cb) params.cb(response)
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    failureToast(
      `Reward could not be updated.${err.message === LANGUAGE_ERROR ? PUBLISH_ERROR : ''}`
    )
    return thunkAPI.rejectWithValue(err.message.original)
  }
});

export const getRewardsById = createAsyncThunk(
  'rewards/getRewardsById',
  async (params, thunkAPI) => {
    try {
      const response = await RewardsService.getDataById({ params });
      return response;
    } catch (err) {
      if (!err.message) {
        throw err;
      }
      return thunkAPI.rejectWithValue(err.message)
    }
  }
);

export const deleteRewardsById = createAsyncThunk(
  'rewards/deleteRewardsById',
  async (params, thunkAPI) => {
    try {
      const response = await RewardsService.deleteDataById({ params })
      if (params.cb) params.cb()
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      if (params.cbf) params.cbf()
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)
