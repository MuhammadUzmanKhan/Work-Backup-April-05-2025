import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { RESET_STORE } from '../../../constants';
import { COMPANY } from '../../../constants';

const companyData = localStorage.getItem(`${COMPANY}`);
const initialState: { company: any } = {
  company: companyData ? JSON.parse(companyData) : null
}

export const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    setCompany: (state, action: PayloadAction<any>) => {
      state.company = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STORE, (_) => {
      return {
        company: null
      }
    });
  },
})

// Action creators are generated for each case reducer function
export const { setCompany } = companySlice.actions

export default companySlice.reducer