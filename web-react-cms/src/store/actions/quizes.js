import { createAsyncThunk } from '@reduxjs/toolkit';
import QuizesSearchService from 'services/QuizesSearchService';
import QuizesService from 'services/QuizesService';
import TagsQuizzesService from 'services/TagsQuizzesService';
import { failureToast } from 'utils'

export const getQuizes = createAsyncThunk('experts/getQuizes', async (params, thunkAPI) => {
  try {
    const response = await QuizesService.getDataList({ params })
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    return thunkAPI.rejectWithValue(err.message.original)
  }
})

export const getQuizTags = createAsyncThunk('experts/getQuizTags', async (params, thunkAPI) => {
  try {
    const response = await TagsQuizzesService.getDataList({ params })
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    return thunkAPI.rejectWithValue(err.message.original)
  }
})

export const getQuizById = createAsyncThunk('quizes/getQuizById', async (params, thunkAPI) => {
  try {
    const response = await QuizesService.getDataById({ params })
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    return thunkAPI.rejectWithValue(err.message)
  }
})

export const updateQuiz = createAsyncThunk('resources/updateQuiz', async (params, thunkAPI) => {
  try {
    const response = await QuizesService.editDataById({ params })
    if (params.cb) params.cb(response)

    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    failureToast(`Quiz could not be updated.  ${err.msg}`)
    return thunkAPI.rejectWithValue(err.message.original)
  }
})

export const createQuiz = createAsyncThunk('quizes/createQuiz', async (params, thunkAPI) => {
  try {
    const response = await QuizesService.postData({ params: params.params })
    if (params.cb) params.cb(response)
    return response
  } catch (err) {
    if (!err.message) {
      console.log(err.message)
      throw err
    }
    failureToast(`Quiz could not be created.  ${err.msg}`)
    return thunkAPI.rejectWithValue(err.message.original)
  }
})

export const getQuizesSearch = createAsyncThunk(
  'quizes/getQuizesSearch',
  async (params, thunkAPI) => {
    try {
      const response = await QuizesSearchService.postData({ params });
      return response;
    } catch (err) {
      if (!err.message) {
        throw err;
      }
      return thunkAPI.rejectWithValue(err.message.original);
    }
  }
);

export const deleteQuiz = createAsyncThunk('quizes/deleteQuiz', async (params, thunkAPI) => {
  try {
    const response = await QuizesService.deleteDataById({ params })
    if (params.cb) params.cb()

    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    failureToast(`Quiz could not be deleted.  ${err.msg}`)
    if (params.cbf) params.cbf()

    return thunkAPI.rejectWithValue(err.message)
  }
})

export const getQuizLinksById = createAsyncThunk(
  'quizes/getQuizLinksById',
  async (params, thunkAPI) => {
    try {
      const response = await QuizesService.getDataById({ params })
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)
