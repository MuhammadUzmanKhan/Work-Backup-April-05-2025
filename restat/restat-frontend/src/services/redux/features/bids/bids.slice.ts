import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { RESET_STORE } from '../../../constants';

const initialState: {
  bids: any;
  bidsCount: number;
  bidsPerPage: number;
} = {
  bids: null,
  bidsCount: 0,
  bidsPerPage: 20,
};

export const bidsSlice = createSlice({
  name: 'bids',
  initialState,
  reducers: {
    setbids: (state, action: PayloadAction<any>) => {
      state.bids = action.payload;
    },
    setBidsCount: (state, action: PayloadAction<number>) => {
      state.bidsCount = action.payload;
    },
    setbidsPerPage: (state, action: PayloadAction<number>) => {
      state.bidsPerPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STORE, (_) => {
      return initialState;
    });
  },
});

// Action creators are generated for each case reducer function
export const { setbids, setBidsCount, setbidsPerPage } =
  bidsSlice.actions;

export default bidsSlice.reducer;
