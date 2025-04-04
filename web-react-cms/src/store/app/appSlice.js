import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import i18n from '../../localization';

const initialState = {
  direction: 'ltr',
  language: 'en'
}

export const setLanguage = createAsyncThunk('app/setLanguage', async (value, { dispatch }) => {
  const direction = value === 'ar' ? 'rtl' : 'ltr'
  i18n.changeLanguage(value)
  dispatch(setDirection(direction))
  localStorage.setItem('language', value)

  return value
})

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setDirection: (state, { payload }) => {
      state.direction = payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(setLanguage.fulfilled, (state, action) => {
      state.language = action.payload;
    });
  }
});

export const { setDirection } = appSlice.actions;

export const selectDirection = (state) => state.app.direction;
export const selectLanguage = (state) => state.app.language;

export default appSlice.reducer;
