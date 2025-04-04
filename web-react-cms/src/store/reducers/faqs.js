import { createSlice } from '@reduxjs/toolkit';
import { getFaqs, updateFaqByExpert, createFaq, getFaqById, deleteFaq } from 'store/actions/faqs'
import { getTags } from 'store/actions/tag'

const initialState = {
  faqs: [],
  tags: [],
  loading: false,
  error: null,
  faq: null
}

export const faqSlice = createSlice({
  name: 'faqs',
  initialState,
  reducers: {
    setStateValue(state, { payload }) {
      return {
        ...state,
        [payload.type]: payload.data
      }
    }
  },
  extraReducers: {
    [getFaqs.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [getFaqs.fulfilled]: (state, { payload }) => {
      state.faqs = payload
      state.loading = false
    },
    [getFaqs.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [getTags.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [getTags.fulfilled]: (state, { payload }) => {
      state.tags = payload
      state.loading = false
    },
    [getTags.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [updateFaqByExpert.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [updateFaqByExpert.fulfilled]: (state) => {
      state.loading = false
    },
    [updateFaqByExpert.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [createFaq.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [createFaq.fulfilled]: (state) => {
      state.loading = false
    },
    [createFaq.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [getFaqById.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [getFaqById.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.faq = payload
    },
    [getFaqById.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [deleteFaq.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [deleteFaq.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.faqs = payload
    },
    [deleteFaq.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    }
  }
})

export const { setStateValue } = faqSlice.actions;

export default faqSlice.reducer;
