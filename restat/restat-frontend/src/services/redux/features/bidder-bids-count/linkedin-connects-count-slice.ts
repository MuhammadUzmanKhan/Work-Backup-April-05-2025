import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { RESET_STORE } from '../../../constants';

const initialState: {
  connectsCount: number,
  prospectsCount: number,
  connectsCountByBusinessDeveloper: {
    deletedAt: any; name: string, connectsCount: number, prospectsCount: number, target: number
  }[],
  industryConnectsCounts: { users: { name: string, connectsCount: number }[], industry: string }[]
  connectionsCountByState: { state: string, prospectsCount: string, connectionsCount: string }[]
  connectsCountByProfile: { name: string, connectionsCount: number, prospectCount: number, deletedAt: string }[]
  monthlyConnectionData: { month: string, connectionsCount: number, prospectsCount: number }[]
} = {
  connectsCount: 0,
  prospectsCount: 0,
  connectsCountByBusinessDeveloper: [],
  industryConnectsCounts: [],
  connectionsCountByState: [],
  connectsCountByProfile: [],
  monthlyConnectionData: [],
};

export const linkedinConnectsSlice = createSlice({
  name: 'linkedin-connects-count',
  initialState,
  reducers: {

    setConnectsCount: (state, action: PayloadAction<any>) => {
      state.connectsCount = action.payload;
    },

    setProspectsCount: (state, action: PayloadAction<any>) => {
      state.prospectsCount = action.payload;
    },

    setConnectsCountByBusinessDeveloper: (state, action: PayloadAction<any>) => {
      state.connectsCountByBusinessDeveloper = action.payload;
    },

    setIndustryConnectsCount: (state, action: PayloadAction<any>) => {
      state.industryConnectsCounts = action.payload;
    },

    setConnectionsCountByState: (state, action: PayloadAction<any>) => {
      state.connectionsCountByState = action.payload;
    },

    setConnectsCountByProfile: (state, action: PayloadAction<any>) => {
      state.connectsCountByProfile = action.payload;
    },

    setMonthlyConnectionData: (state, action: PayloadAction<any>) => {
      state.monthlyConnectionData = action.payload;
    },

  },
  extraReducers: builder => {
    builder.addCase(RESET_STORE, (_) => {
      return initialState
    });
  },
});

export const {
  setConnectsCount,
  setProspectsCount,
  setConnectsCountByBusinessDeveloper,
  setIndustryConnectsCount,
  setConnectionsCountByState,
  setConnectsCountByProfile,
  setMonthlyConnectionData,
} = linkedinConnectsSlice.actions;

export default linkedinConnectsSlice.reducer;
