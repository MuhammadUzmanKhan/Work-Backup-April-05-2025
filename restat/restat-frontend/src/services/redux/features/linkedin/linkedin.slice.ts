import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { RESET_STORE } from '../../../constants';

const initialState: {
  linkedinIndustries: string[],
  linkedinAccounts: any[];
  linkedinAccountsCount: number;
  linkedinAccountsPerPage: number;
  linkedinConnectionsCountByState: any[]
} = {
  linkedinIndustries: [],
  linkedinAccounts: [],
  linkedinAccountsCount: 0,
  linkedinAccountsPerPage: 20,
  linkedinConnectionsCountByState: []
};

export const linkedin = createSlice({
  name: 'linkedin',
  initialState,
  reducers: {
    setLinkedinIndustries: (state, action: PayloadAction<any>) => {
      state.linkedinIndustries = action.payload;
    },
    setLinkedinAccounts: (state, action: PayloadAction<any>) => {
      state.linkedinAccounts = action.payload;
    },
    setLinkedinAccountsCount: (state, action: PayloadAction<number>) => {
      state.linkedinAccountsCount = action.payload;
    },
    setLinkedinAccountsPerPage: (state, action: PayloadAction<number>) => {
      state.linkedinAccountsPerPage = action.payload;
    },
    setLinkedinConnectionsCountByState: (state, action: PayloadAction<any>) => {
      state.linkedinConnectionsCountByState = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STORE, (_) => {
      return initialState;
    });
  },
});

// Action creators are generated for each case reducer function
export const {setLinkedinIndustries, setLinkedinAccounts, setLinkedinAccountsCount, setLinkedinAccountsPerPage, setLinkedinConnectionsCountByState } =
  linkedin.actions;

export default linkedin.reducer;
