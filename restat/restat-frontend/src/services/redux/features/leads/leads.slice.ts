import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { RESET_STORE } from '../../../constants';

const initialState: {
  leads: any;
  leadsCount: number;
  leadsPerPage: number;
} = {
  leads: null,
  leadsCount: 0,
  leadsPerPage: 20,
};

export const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    setLeads: (state, action: PayloadAction<any>) => {
      state.leads = action.payload;
    },
    setLeadsCount: (state, action: PayloadAction<number>) => {
      state.leadsCount = action.payload;
    },
    setLeadsPerPage: (state, action: PayloadAction<number>) => {
      state.leadsPerPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STORE, (_) => {
      return initialState;
    });
  },
});

// Action creators are generated for each case reducer function
export const { setLeads, setLeadsCount, setLeadsPerPage } =
  leadsSlice.actions;

export default leadsSlice.reducer;
