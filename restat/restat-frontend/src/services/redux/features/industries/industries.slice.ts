import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { RESET_STORE } from '../../../constants';

const initialState: {
  industries: any[];
  industriesCount: number;
  industriesPerPage: number;
} = {
  industries: [],
  industriesCount: 0,
  industriesPerPage: 20,
};

export const industriesSlice = createSlice({
  name: 'industries',
  initialState,
  reducers: {
    setIndustries: (state, action: PayloadAction<any>) => {
      state.industries = action.payload;
    },
    setIndustriesCount: (state, action: PayloadAction<number>) => {
      state.industriesCount = action.payload;
    },
    setIndustriesPerPage: (state, action: PayloadAction<number>) => {
      state.industriesPerPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STORE, (_) => {
      return initialState;
    });
  },
});

export const { setIndustries, setIndustriesCount, setIndustriesPerPage } =
  industriesSlice.actions;

export default industriesSlice.reducer;
