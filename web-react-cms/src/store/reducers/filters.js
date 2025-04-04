import { createSlice } from '@reduxjs/toolkit';
import { getFilters } from 'store/actions/filters';

const initialState = {
  filters: [],
  loading: false,
  error: null
};

export const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setStateValue(state, { payload }) {
      return {
        ...state,
        [payload.type]: payload.data
      };
    }
  },
  extraReducers: {
    [getFilters.pending]: (state) => {
      state.loading = true;
      state.error = null;
    },
    [getFilters.fulfilled]: (state, { payload }) => {
      state.filters = payload;
      state.loading = false;
    },
    [getFilters.rejected]: (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    }
  }
});

export const { setStateValue } = filterSlice.actions;

export default filterSlice.reducer;
