import { createAsyncThunk } from '@reduxjs/toolkit';
import DashboardService from '../../services/DashboardService';

export const fetchData = createAsyncThunk('dashboard/fetchData', async (params, thunkAPI) => {
  try {
    const response = await DashboardService.getDataList({ params });
    return response;
  } catch (err) {
    if (!err.message) {
      throw err;
    }
    return thunkAPI.rejectWithValue(err.message.original);
  }
});
