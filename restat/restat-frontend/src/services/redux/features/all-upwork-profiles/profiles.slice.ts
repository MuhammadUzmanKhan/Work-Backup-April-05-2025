import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { RESET_STORE } from '../../../constants';

const initialState: {
  profiles: any;
  linkedInProfiles: {id: string, name: string}[]
} = {
  profiles: null,
  linkedInProfiles: [],
};

export const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    setProfiles: (state, action: PayloadAction<any>) => {
      state.profiles = action.payload;
    },

    setLinkedInProfiles: (state, action: PayloadAction<any>) => {
      state.linkedInProfiles = action.payload;
    },

  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STORE, (_) => {
      return initialState;
    });
  },
});

// Action creators are generated for each case reducer function
export const { setProfiles, setLinkedInProfiles } = profilesSlice.actions;

export default profilesSlice.reducer;
