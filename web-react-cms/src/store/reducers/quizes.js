import { createSlice } from '@reduxjs/toolkit';
import {
  getQuizes,
  getQuizTags,
  updateQuiz,
  createQuiz,
  getQuizesSearch,
  getQuizById,
  deleteQuiz
} from 'store/actions/quizes'

const initialState = {
  quizes: [],
  quiz: null,
  tags: [],
  loading: false,
  quizLoading: false,
  error: null
};

export const quizeSlice = createSlice({
  name: 'quizes',
  initialState,
  reducers: {
    setQuizStateValue(state, { payload }) {
      return {
        ...state,
        [payload.type]: payload.data
      }
    }
  },
  extraReducers: {
    [getQuizes.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [getQuizes.fulfilled]: (state, { payload }) => {
      state.quizes = payload
      state.loading = false
    },
    [getQuizes.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [getQuizTags.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [getQuizTags.fulfilled]: (state, { payload }) => {
      state.tags = payload
      state.loading = false
    },
    [getQuizTags.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [updateQuiz.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [updateQuiz.fulfilled]: (state) => {
      state.loading = false
    },
    [updateQuiz.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [createQuiz.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [createQuiz.fulfilled]: (state) => {
      state.loading = false
    },
    [createQuiz.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [getQuizesSearch.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [getQuizesSearch.fulfilled]: (state) => {
      state.loading = false
    },
    [getQuizesSearch.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [getQuizById.pending]: (state) => {
      state.quizLoading = true
      state.error = null
    },
    [getQuizById.fulfilled]: (state, { payload }) => {
      state.quizLoading = false
      state.quiz = payload
    },
    [getQuizById.rejected]: (state, { payload }) => {
      state.quizLoading = false
      state.error = payload
    },
    [deleteQuiz.pending]: (state) => {
      state.quizLoading = true
      state.error = null
    },
    [deleteQuiz.fulfilled]: (state, { payload }) => {
      state.quizLoading = false
      state.quiz = payload
    },
    [deleteQuiz.rejected]: (state, { payload }) => {
      state.quizLoading = false
      state.error = payload
    }
  }
})

export const { setQuizStateValue } = quizeSlice.actions;

export default quizeSlice.reducer;
