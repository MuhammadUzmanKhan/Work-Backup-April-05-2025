import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { RESET_STORE } from '../../../constants';

const initialState: {
  bidsCount: number;
  totalBidsCount: number;
  securedJobsCount: number;
  leadsCount: number;
  totalLeadsCount: number;
  invitesCount: number;
  inviteJobs: number;
  directCount: number;
  directContractsCount: number;
  totalContractsCount: number;
  bidsCountByProfile: {
    name: string,
    deletedAt: string,
    bidsCount: number,
    leadsCount: number,
    contractsCount: number,
    invitesCount: number,
    inviteContracts: number,
    directLeadsCount: number,
    directContractsCount: number,
  }[],
  bidsCountByBidders: {
    name: string,
    responseTime: string | null
    userDeletedAt: string,
    bidsCount: number,
    leadsWonCount: number,
    securedJobsCount: number,
    invitesCount: number,
    inviteContractsCount: number,
    directLeadsCount: number,
    directContractsCount: number,
    totalBidsCount: number,
    totalSecuredJobsCount: number,
    totalLeadsWonCount: number,
    target: number
  }[],
  bidsCountByCategory: {
    category: string,
    bidsCount: number,
    leadsCount: number,
    contractsCount: number,
    invitesCount: number,
    inviteContracts: number,
    directLeadsCount: number,
    directContractsCount: number,
  }[],
  bidsCountByState: { state: string, bidsCount: string, leadsCount: string, jobsCount: string, invitesCount: string }[],
  bidsMonthlyReport: { month: string, bidsCount: string, leadsCount: string, contractsCount: string, invitesCount: string, totalProposalsCount: number, totalConnects: number, inviteContractsCount: string, directCount: string, directContractsCount: string }[],
  bidByResponseHourlyReport: { hour: string, bidsCount: string, leadsCount: string }[],
  funnelStats: { proposalsCount: number, leadsCount: number, contractsCount: number, inviteLeadsCount: number, inviteContractsCount: number, directLeadsCount: number, directContractsCount: number }

} = {
  bidsCount: 0,
  totalBidsCount: 0,
  securedJobsCount: 0,
  leadsCount: 0,
  totalLeadsCount: 0,
  invitesCount: 0,
  inviteJobs: 0,
  directCount: 0,
  directContractsCount: 0,
  totalContractsCount: 0,
  bidsCountByProfile: [],
  bidsCountByBidders: [],
  bidsCountByCategory: [],
  bidsCountByState: [],
  bidsMonthlyReport: [],
  bidByResponseHourlyReport: [],
  funnelStats: { proposalsCount: 0, leadsCount: 0, contractsCount: 0, inviteLeadsCount: 0, inviteContractsCount: 0, directLeadsCount: 0, directContractsCount: 0 },
};

export const bidderBidsCountSlice = createSlice({
  name: 'bidder-bids-count',
  initialState,
  reducers: {
    setbidsCount: (state, action: PayloadAction<number>) => {
      state.bidsCount = action.payload;
    },
    setTotalBidsCount: (state, action: PayloadAction<number>) => {
      state.totalBidsCount = action.payload;
    },
    setSecuredJobsCount: (state, action: PayloadAction<number>) => {
      state.securedJobsCount = action.payload;
    },
    setLeadsCount: (state, action: PayloadAction<number>) => {
      state.leadsCount = action.payload;
    },
    setTotalLeadsCount: (state, action: PayloadAction<number>) => {
      state.totalLeadsCount = action.payload;
    },
    setInvitesCount: (state, action: PayloadAction<number>) => {
      state.invitesCount = action.payload;
    },
    setInviteJobs: (state, action: PayloadAction<number>) => {
      state.inviteJobs = action.payload;
    },
    setDirectCount: (state, action: PayloadAction<number>) => {
      state.directCount = action.payload;
    },
    setDirectContractsCount: (state, action: PayloadAction<number>) => {
      state.directContractsCount = action.payload;
    },
    setTotalContractsCount: (state, action: PayloadAction<number>) => {
      state.totalContractsCount = action.payload;
    },
    setBidsCountByProfile: (state, action: PayloadAction<any>) => {
      state.bidsCountByProfile = action.payload;
    },
    setBidsCountByBidders: (state, action: PayloadAction<any>) => {
      state.bidsCountByBidders = action.payload;
    },
    setBidsCountByCategory: (state, action: PayloadAction<any>) => {
      state.bidsCountByCategory = action.payload;
    },
    setBidsCountByState: (state, action: PayloadAction<any>) => {
      state.bidsCountByState = action.payload;
    },
    setBidsMonthlyReport: (state, action: PayloadAction<any>) => {
      state.bidsMonthlyReport = action.payload;
    },
    setBidByResponseHourlyReport: (state, action: PayloadAction<any>) => {
      state.bidByResponseHourlyReport = action.payload;
    },
    setFunnelStats: (state, action: PayloadAction<any>) => {
      state.funnelStats = action.payload;
    },
  },
  extraReducers: builder => {
    builder.addCase(RESET_STORE, (_) => {
      return initialState
    });
  },
});

// Action creators are generated for each case reducer function
export const {
  setbidsCount,
  setTotalBidsCount,
  setSecuredJobsCount,
  setLeadsCount,
  setTotalLeadsCount,
  setInvitesCount,
  setBidsCountByProfile,
  setBidsCountByBidders,
  setBidsCountByCategory,
  setBidsCountByState,
  setBidsMonthlyReport,
  setInviteJobs,
  setDirectCount,
  setDirectContractsCount,
  setTotalContractsCount,
  setBidByResponseHourlyReport,
  setFunnelStats,
} =
  bidderBidsCountSlice.actions;

export default bidderBidsCountSlice.reducer;
