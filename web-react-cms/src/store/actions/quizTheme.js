import { createAsyncThunk } from '@reduxjs/toolkit'
import { failureToast } from 'utils'
import QuizThemeService from '../../services/QuizThemeService'

export const getQuizThemes = createAsyncThunk(
  'quizThemes/getQuizThemes',
  async (params, thunkAPI) => {
    try {
      const response = await QuizThemeService.getDataList({ params })
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message.original)
    }
  }
)

export const getQuizThemesById = createAsyncThunk(
  'quizThemes/getQuizThemesById',
  async (params, thunkAPI) => {
    try {
      const response = await QuizThemeService.getDataById({ params })
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)


export const updateQuizThemesById = createAsyncThunk(
  'quizThemes/updateQuizThemesById',
  async (params, thunkAPI) => {
    try {
      const response = await QuizThemeService.editDataById({ params })
      if (params.cb) params.cb(response)
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      failureToast(`Quiz Theme could not be updated.  ${err.msg}`)
      return thunkAPI.rejectWithValue(err.message.original)
    }
  }
)

export const createQuizThemes = createAsyncThunk(
  'quizThemes/createQuizThemes',
  async (params, thunkAPI) => {
    try {
      const response = await QuizThemeService.postData({ params: params.params })
      if (params.cb) params.cb(response)
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      failureToast('Quiz Theme could not be created.')

      return thunkAPI.rejectWithValue(err.message.original)
    }
  }
)

export const getQuizThemeActive = createAsyncThunk(
  'quizThemes/getQuizThemeActive',
  async (params, thunkAPI) => {
    try {
      const response = await QuizThemeService.getDataById({ params })
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)


export const deleteQuizThemesById = createAsyncThunk(
  'quizThemes/deleteQuizThemesById',
  async (params, thunkAPI) => {
    try {
      const response = await QuizThemeService.deleteDataById({ params })
      if (params.cb) params.cb()
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      if (params.cbf) params.cbf()
      failureToast(`Quiz Theme could not be deleted.  ${err.msg}`)
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)