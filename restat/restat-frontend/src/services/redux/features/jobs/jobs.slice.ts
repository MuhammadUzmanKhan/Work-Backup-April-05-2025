import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { RESET_STORE } from '../../../constants';

const initialState: {
  jobs: any;
  jobsCount: number;
  jobsPerPage: number;
} = {
  jobs: null,
  jobsCount: 0,
  jobsPerPage: 20,
};

export const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setJobs: (state, action: PayloadAction<any>) => {
      state.jobs = action.payload;
    },
    setJobsCount: (state, action: PayloadAction<number>) => {
      state.jobsCount = action.payload;
    },
    setJobsPerPage: (state, action: PayloadAction<number>) => {
      state.jobsPerPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STORE, (_) => {
      return initialState;
    });
  },
});

// Action creators are generated for each case reducer function
export const { setJobs, setJobsCount, setJobsPerPage } =
  jobsSlice.actions;

export default jobsSlice.reducer;
