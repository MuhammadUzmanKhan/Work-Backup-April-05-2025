import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  rewards: []
}

export const rewardsSlice = createSlice({
  name: 'rewards',
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

export const { setStateValue } = rewardsSlice.actions;

export default rewardsSlice.reducer;
