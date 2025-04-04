import { createSlice } from '@reduxjs/toolkit';
import { fetchData } from 'store/actions/dashboard';
import { DashboardAdapter } from '../../models/adapters/DashboardAdapter';

const initialState = {
  data: [],
  loader: false
};

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setData: (state, { payload }) => {
      state.data = DashboardAdapter.mapDashboardDtoToDashboardModel(payload);
    },
    setLoader: (state, { payload }) => {
      state.loader = payload;
    }
  },
  extraReducers: {
    [fetchData.pending]: (state) => {
      state.loaders = true;
      state.error = null;
    },
    [fetchData.fulfilled]: (state, { payload }) => {
      state.data = payload;
      // state.data = DashboardAdapter.mapDashboardDtoToDashboardModel(payload);
      state.loaders = false;
    },
    [fetchData.rejected]: (state, { payload }) => {
      state.loaders = false;
      state.error = payload;
    }
  }
});

export const { setData, setLoader } = dashboardSlice.actions;

export default dashboardSlice.reducer;
