import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { RESET_STORE } from '../../../constants';
import { IContact } from '../../../types/contacts';

const initialState: {
  contacts: IContact[];
  contactsCount: number;
  contactsPerPage: number;
} = {
  contacts: [],
  contactsCount: 0,
  contactsPerPage: 20,
};

export const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    setContacts: (state, action: PayloadAction<any>) => {
      state.contacts = action.payload;
    },
    setContactsCount: (state, action: PayloadAction<number>) => {
      state.contactsCount = action.payload;
    },
    setContactsPerPage: (state, action: PayloadAction<number>) => {
      state.contactsPerPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STORE, (_) => {
      return initialState
    });
  },
});

// Action creators are generated for each case reducer function
export const { setContacts, setContactsCount, setContactsPerPage } =
  contactsSlice.actions;

export default contactsSlice.reducer;
