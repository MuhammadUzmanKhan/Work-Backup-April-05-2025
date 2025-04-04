import { createAsyncThunk } from '@reduxjs/toolkit'
import PermissionsService from 'services/PermissionsService'

export const getPermissions = createAsyncThunk(
  'permissions/getPermissions',
  async (params, thunkAPI) => {
    try {
      const response = await PermissionsService.getDataList({ params })
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)
