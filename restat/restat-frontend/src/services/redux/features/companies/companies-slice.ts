import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { RESET_STORE } from '../../../constants';
import { ICompanies } from '../../../types/companies';

const initialState: {
  companies: ICompanies[];
  companiesCount: number;
  companiesPerPage: number;
} = {
  companies: [],
  companiesCount: 0,
  companiesPerPage: 20,
};

export const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    setCompanies: (state, action: PayloadAction<any>) => {
      state.companies = action.payload;
    },
    setCompaniesCount: (state, action: PayloadAction<number>) => {
      state.companiesCount = action.payload;
    },
    setCompaniesPerPage: (state, action: PayloadAction<number>) => {
      state.companiesPerPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STORE, (_) => {
      return initialState
    });
  },
});

// Action creators are generated for each case reducer function
export const { setCompanies, setCompaniesCount, setCompaniesPerPage } =
  companiesSlice.actions;

export default companiesSlice.reducer;

