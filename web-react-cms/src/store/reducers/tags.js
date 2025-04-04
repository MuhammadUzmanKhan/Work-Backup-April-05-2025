import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tags: []
};

export const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    setStateValue(state, { payload }) {
      return {
        ...state,
        [payload.type]: payload.data
      };
    }
  }
});

export const { setStateValue } = tagsSlice.actions;

export default tagsSlice.reducer;
