import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { RESET_STORE } from '../../../constants';

const initialState: {
  users: any;
  selectedUsersColumn: any,
  usersCount: number;
  usersPerPage: number;
} = {
  users: null,
  selectedUsersColumn: null,
  usersCount: 0,
  usersPerPage: 20,
};

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setusers: (state, action: PayloadAction<any>) => {
      state.users = action.payload;
    },
    setSelectedUsersColumn: (state, action: PayloadAction<any>) => {
      state.selectedUsersColumn = action.payload;
    }, 
    setUsersCount: (state, action: PayloadAction<number>) => {
      state.usersCount = action.payload;
    },
    setUsersPerPage: (state, action: PayloadAction<number>) => {
      state.usersPerPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STORE, (_) => {
      return initialState;
    });
  },
});

// Action creators are generated for each case reducer function
export const { setusers, setUsersCount, setUsersPerPage, setSelectedUsersColumn } =
  usersSlice.actions;

export default usersSlice.reducer;
