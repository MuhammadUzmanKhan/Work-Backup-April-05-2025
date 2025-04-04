import { createAsyncThunk } from '@reduxjs/toolkit';
import { failureToast } from 'utils';
import ImageService from '../../services/ImageService';

export const setImage = createAsyncThunk('image/setImage', async (params, thunkAPI) => {
  try {
    const response = await ImageService.getImageUrl({
      params: params?.fieldName ? params.params : params
    })
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    failureToast((params.fieldName ? `${params.fieldName} ` : '') + 'Image could not be uploaded')

    return thunkAPI.rejectWithValue(err.message)
  }
});
