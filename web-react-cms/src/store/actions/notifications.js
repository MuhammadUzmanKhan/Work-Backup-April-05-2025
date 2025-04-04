import { createAsyncThunk } from '@reduxjs/toolkit'
import { failureToast } from 'utils'
import NotificationsService from '../../services/NotificationsService'
import TailoredNotificationService from '../../services/TailoredNotificationService'

export const createNotifications = createAsyncThunk(
  'notifications/createNotifications',
  async (params, thunkAPI) => {
    try {
      const response = await NotificationsService.postData({ params: params.params })
      if (params.cb) params.cb(response)
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      failureToast('Notification could not be created.')

      return thunkAPI.rejectWithValue(err.message)
    }
  }
)

export const createNotificationsTailored = createAsyncThunk(
  'notifications/createNotificationsTailored',
  async (params, thunkAPI) => {
    try {
      const response = await TailoredNotificationService.postData({ params: params.params })
      if (params.cb) params.cb()
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      failureToast('Notification could not be created.')

      return thunkAPI.rejectWithValue(err.message)
    }
  }
)

export const getNotificationsTailored = createAsyncThunk(
  'notifications/getNotificationsTailored',
  async (params, thunkAPI) => {
    try {
      const response = await TailoredNotificationService.getDataById({ params })
      if (params.cb) params.cb()
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }

      return thunkAPI.rejectWithValue(err.message)
    }
  }
)
