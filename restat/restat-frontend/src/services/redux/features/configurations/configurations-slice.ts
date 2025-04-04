import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { RESET_STORE } from '../../../constants';
import { GlobalConfiguration } from '../../../types/common';

const initialState: {
  globalConfiguration: GlobalConfiguration | null;
  accountDeletionDate: string | null;
} = {
  globalConfiguration: null,
  accountDeletionDate: null,
};

export const configurationsSlick = createSlice({
  name: 'configurations',
  initialState,
  reducers: {
    setGlobalConfigurations: (state, action: PayloadAction<GlobalConfiguration>) => {
      state.globalConfiguration = action.payload;
    },
    setAccountDeletionDate: (state, action: PayloadAction<string | null>) => {
      state.accountDeletionDate = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STORE, (_) => {
      return initialState
    });
  },
});

// Action creators are generated for each case reducer function
export const { setGlobalConfigurations, setAccountDeletionDate } =
  configurationsSlick.actions;

export default configurationsSlick.reducer;
