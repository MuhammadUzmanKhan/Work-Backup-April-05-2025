import { createAsyncThunk } from '@reduxjs/toolkit';
import ProductProvider from '../../services/ProductProviderService';

export const getPoints = createAsyncThunk('resources/getPoints', async (params, thunkAPI) => {
  try {
    const response = await ProductProvider.getDataList({ params });
    return response;
  } catch (err) {
    if (!err.message) {
      throw err;
    }
    return thunkAPI.rejectWithValue(err.message.original);
  }
});
