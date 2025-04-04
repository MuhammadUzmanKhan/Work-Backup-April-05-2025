import { createSlice } from '@reduxjs/toolkit';
import { getResources } from 'store/actions/resources';

const initialState = {
  points: [],
  point: null,
  selectedPoint: null,
  selectedTab: 1,
  loading: false,
  error: null
};

export const pointsSlice = createSlice({
  name: 'resources',
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
    [getResources.pending]: (state) => {
      state.loading = true;
      state.error = null;
    },
    [getResources.fulfilled]: (state, { payload }) => {
      state.points = payload;
      state.loading = false;
    },
    [getResources.rejected]: (state, { payload }) => {
      state.loading = false;
      state.error = payload;
    }
  }
});

export const { setStateValue } = pointsSlice.actions;

export default pointsSlice.reducer;
