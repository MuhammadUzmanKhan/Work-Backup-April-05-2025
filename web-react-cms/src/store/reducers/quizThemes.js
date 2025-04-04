import { createSlice } from '@reduxjs/toolkit'
import {
  getQuizThemes,
  getQuizThemesById,
  updateQuizThemesById,
  createQuizThemes,
  getQuizThemeActive,
  deleteQuizThemesById
} from 'store/actions/quizTheme'

const initialState = {
  quizThemes: [],
  quizTheme: null,
  activeTheme: null,
  loading: false,
  error: null
}

export const quizThemesSlice = createSlice({
  name: 'quizThemes',
  initialState,
  reducers: {
    setStateQuizThemeValue(state, { payload }) {
      return {
        ...state,
        [payload.type]: payload.data
      }
    }
  },
  extraReducers: {
    [createQuizThemes.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [createQuizThemes.fulfilled]: (state) => {
      state.loading = false
    },
    [createQuizThemes.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [getQuizThemes.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [getQuizThemes.fulfilled]: (state, { payload }) => {
      state.quizThemes = payload
      state.loading = false
    },
    [getQuizThemes.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [getQuizThemesById.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [getQuizThemesById.fulfilled]: (state, { payload }) => {
      state.quizTheme = payload
      state.loading = false
    },
    [getQuizThemesById.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [updateQuizThemesById.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [updateQuizThemesById.fulfilled]: (state) => {
      state.loading = false
    },
    [updateQuizThemesById.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [getQuizThemeActive.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [getQuizThemeActive.fulfilled]: (state, { payload }) => {
      state.activeTheme = payload
      state.loading = false
    },
    [getQuizThemeActive.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [deleteQuizThemesById.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [deleteQuizThemesById.fulfilled]: (state) => {
      state.loading = false
    },
    [deleteQuizThemesById.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    }
  }
})

export const { setStateQuizThemeValue } = quizThemesSlice.actions

export default quizThemesSlice.reducer
