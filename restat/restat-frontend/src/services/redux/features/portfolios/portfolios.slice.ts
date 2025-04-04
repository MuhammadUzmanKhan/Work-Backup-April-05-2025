import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { RESET_STORE } from '../../../constants';

const initialState: {
  portfolios: any;
  portfoliosCount: number;
  portfoliosPerPage: number;
} = {
  portfolios: null,
  portfoliosCount: 0,
  portfoliosPerPage: 20,
};

export const portfoliosSlice = createSlice({
  name: 'portfolios',
  initialState,
  reducers: {
    setPortfolios: (state, action: PayloadAction<any>) => {
      state.portfolios = action.payload;
    },
    setPortfoliosCount: (state, action: PayloadAction<number>) => {
      state.portfoliosCount = action.payload;
    },
    setPortfoliosPerPage: (state, action: PayloadAction<number>) => {
      state.portfoliosPerPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STORE, (_) => {
      return initialState;
    });
  },
});

// Action creators are generated for each case reducer function
export const { setPortfolios, setPortfoliosCount, setPortfoliosPerPage } =
  portfoliosSlice.actions;

export default portfoliosSlice.reducer;
