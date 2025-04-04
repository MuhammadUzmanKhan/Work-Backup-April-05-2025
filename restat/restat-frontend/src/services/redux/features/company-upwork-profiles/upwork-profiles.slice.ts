import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { RESET_STORE } from '../../../constants';

const initialState: {
  profiles: any;
  profilesPerPage: number,
  profilesCount: number
} = {
  profiles: null,
  profilesPerPage: 20,
  profilesCount: 0
};

export const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    setProfiles: (state, action: PayloadAction<any>) => {
      state.profiles = action.payload;
    },
    setProfilesCount: (state, action: PayloadAction<number>) => {
      state.profilesCount = action.payload;
    },
    setProfilesPerPage: (state, action: PayloadAction<number>) => {
      state.profilesPerPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STORE, (_) => {
      return initialState;
    });
  },
});

// Action creators are generated for each case reducer function
export const { setProfiles, setProfilesCount, setProfilesPerPage } = profilesSlice.actions;

export default profilesSlice.reducer;
