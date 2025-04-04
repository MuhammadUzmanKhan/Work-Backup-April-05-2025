import { createSlice } from '@reduxjs/toolkit';
import { fetchPartners, fetchPartnerById, editPartner } from 'store/actions/partners';
// import { partnersList } from 'utils/fakeValues';

const initialState = {
  partners: [],
  partner: null,
  selectedPartner: null,
  isLoading: false,
  error: null
};

export const partnersSlice = createSlice({
  name: 'partners',
  initialState,
  reducers: {
    setStatePartnerValue(state, { payload }) {
      console.log(payload)
      return {
        ...state,
        [payload.type]: payload.data
      };
    }
  },
  extraReducers: {
    [fetchPartners.pending]: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    [fetchPartners.fulfilled]: (state, { payload }) => {
      state.partners = payload;
      state.isLoading = false;
    },
    [fetchPartners.rejected]: (state, { payload }) => {
      state.isLoading = false;
      state.error = payload;
    },
    [fetchPartnerById.pending]: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    [fetchPartnerById.fulfilled]: (state, { payload }) => {
      state.partner = payload;
      state.isLoading = false;
    },
    [fetchPartnerById.rejected]: (state, { payload }) => {
      state.isLoading = false;
      state.error = payload;
    },
    [editPartner.pending]: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    [editPartner.fulfilled]: (state) => {
      state.isLoading = false;
    },
    [editPartner.rejected]: (state, { payload }) => {
      state.isLoading = false;
      state.error = payload;
    }
  }
});

export const { setStatePartnerValue } = partnersSlice.actions;

export default partnersSlice.reducer;
