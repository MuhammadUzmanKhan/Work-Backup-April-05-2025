import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  permissions: []
  // permissions: [
  //   'read:all',
  //   'write:asset',
  //   'write:product',
  //   'write:faq',
  //   // 'write:guidebook',
  //   'write:quizqna',
  //   'write:expert',
  //   'publish:reward'
  //   // 'write:reward',
  //   // 'write:partner'
  //   // 'write:category'
  //   // 'write:tag'
  // ]
  // permissions: ['read:all', 'write:all', 'publish:all']
}

export const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    setStateValue(state, { payload }) {
      return {
        ...state,
        [payload.type]: payload.data
      }
    }
  }
})

export const { setStateValue } = permissionsSlice.actions

export default permissionsSlice.reducer
