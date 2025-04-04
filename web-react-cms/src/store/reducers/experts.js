import { createSlice } from '@reduxjs/toolkit';
import {
  getExpertById,
  getExperts,
  updateExpert,
  createExpert,
  getFaqsByExpert,
  getResoucesByExpert,
  getResoucesByExpertByLang,
  getExpertsByArabicLang
} from 'store/actions/experts'

const initialState = {
  experts: [],
  expertFaqs: [],
  expertResources: [],
  expert: null,
  selectedExpert: null,
  loading: false,
  error: null
};

export const expertsSlice = createSlice({
  name: 'experts',
  initialState,
  reducers: {
    setResourceValue(state, { payload }) {
      return {
        ...state,
        [payload.type]: payload.data
      };
    }
  },
  extraReducers: {
    [getExperts.pending]: (state) => {
      state.loading = true;
      state.error = null;
    },
    [getExperts.fulfilled]: (state, { payload }) => {
      state.experts = payload;
      state.loading = false;
    },
    [getExperts.rejected]: (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    },
    [getExpertById.pending]: (state) => {
      state.loading = true;
      state.error = null;
    },
    [getExpertById.fulfilled]: (state, { payload }) => {
      state.expert = payload;
      state.loading = false;
    },
    [getExpertById.rejected]: (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    },
    [updateExpert.pending]: (state) => {
      state.loading = true;
      state.error = null;
    },
    [updateExpert.fulfilled]: (state) => {
      state.loading = false;
    },
    [updateExpert.rejected]: (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    },
    [createExpert.pending]: (state) => {
      state.loading = true;
      state.error = null;
    },
    [createExpert.fulfilled]: (state) => {
      state.loading = false;
    },
    [createExpert.rejected]: (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    },
    [getFaqsByExpert.pending]: (state) => {
      state.loading = true;
      state.error = null;
    },
    [getFaqsByExpert.fulfilled]: (state, { payload }) => {
      state.loading = false;
      state.expertFaqs = payload;
    },
    [getFaqsByExpert.rejected]: (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    },
    [getResoucesByExpert.pending]: (state) => {
      state.loading = true;
      state.error = null;
    },
    [getResoucesByExpert.fulfilled]: (state, { payload }) => {
      state.loading = false;
      state.expertResources = payload;
    },
    [getResoucesByExpert.rejected]: (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    },
    [getResoucesByExpertByLang.pending]: (state) => {
      state.loading = true;
      state.error = null;
    },
    [getResoucesByExpertByLang.fulfilled]: (state, { payload }) => {
      state.loading = false;
      state.expertResources = [...state.expertResources, ...payload]
    },
    [getResoucesByExpertByLang.rejected]: (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    },
    [getExpertsByArabicLang.pending]: (state) => {
      state.loading = true;
      state.error = null;
    },
    [getExpertsByArabicLang.fulfilled]: (state, { payload }) => {
      state.loading = false;
      state.experts = [...state.experts, ...payload]
    },
    [getExpertsByArabicLang.rejected]: (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    }
  }
});

export const { setResourceValue } = expertsSlice.actions;

export default expertsSlice.reducer;
