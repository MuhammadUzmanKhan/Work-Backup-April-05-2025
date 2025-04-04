import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { RESET_STORE } from '../../../constants';

const initialState: {
  deals: any[];
  dealsCount: number;
  dealsPerPage: number;
  totalProposalCount: number;
  totalLeadsCount: number;
  totalContractsCount: number;
} = {
  deals: [],
  dealsCount: 0,
  dealsPerPage: 20,
  totalProposalCount: 0,
  totalLeadsCount: 0,
  totalContractsCount: 0,
};

export const dealsSlice = createSlice({
  name: 'deals',
  initialState,
  reducers: {
    setDeals: (state, action: PayloadAction<any[]>) => {
      state.deals = action.payload;
    },
    setDealsCount: (state, action: PayloadAction<number>) => {
      state.dealsCount = action.payload
    },
    setDealsPerPage: (state, action: PayloadAction<number>) => {
      state.dealsPerPage = action.payload;
    },
    setTotalProposalsCount: (state, action: PayloadAction<number>) => {
      state.totalProposalCount = action.payload;
    },
    setTotalLeadsCount: (state, action: PayloadAction<number>) => {
      state.totalLeadsCount = action.payload;
    },
    setTotalContractsCounts: (state, action: PayloadAction<number>) => {
      state.totalContractsCount = action.payload;
    },


  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STORE, (_) => {
      return initialState;
    });
  },
});

// Action creators are generated for each case reducer function
export const { setDeals, setDealsCount, setDealsPerPage, setTotalContractsCounts, setTotalLeadsCount, setTotalProposalsCount } = dealsSlice.actions;

export default dealsSlice.reducer;
