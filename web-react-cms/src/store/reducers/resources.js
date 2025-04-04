import { createSlice } from '@reduxjs/toolkit';
import {
  getResourceById,
  getResources,
  updateResourceById,
  createResource,
  getResourcesByArabicLang
  // getResourceLinksById,
  // deleteResourceById
} from 'store/actions/resources'

const initialState = {
  resources: [],
  resource: null,
  selectedResource: null,
  selectedExpert: null,
  loading: false,
  error: null
}

export const resourcesSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    setStateResourceValue(state, { payload }) {
      return {
        ...state,
        [payload.type]: payload.data
      }
    }
  },
  extraReducers: {
    [createResource.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [createResource.fulfilled]: (state) => {
      state.loading = false
    },
    [createResource.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [getResources.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [getResources.fulfilled]: (state, { payload }) => {
      state.resources = payload
      state.loading = false
    },
    [getResources.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [getResourceById.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [getResourceById.fulfilled]: (state, { payload }) => {
      state.resource = payload
      state.loading = false
    },
    [getResourceById.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [updateResourceById.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [updateResourceById.fulfilled]: (state) => {
      // state.resource = payload;
      state.loading = false
    },
    [updateResourceById.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    },
    [getResourcesByArabicLang.pending]: (state) => {
      state.loading = true
      state.error = null
    },
    [getResourcesByArabicLang.fulfilled]: (state, { payload }) => {
      state.resources = [...state.resources, ...payload]
      state.loading = false
    },
    [getResourcesByArabicLang.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = payload
    }
    // [getResourceLinksById.pending]: (state) => {
    //   state.loading = true
    //   state.error = null
    // },
    // [getResourceLinksById.fulfilled]: (state) => {
    //   state.loading = false
    // },
    // [getResourceLinksById.rejected]: (state, { payload }) => {
    //   state.loading = false
    //   state.error = payload
    // },
    // [deleteResourceById.pending]: (state) => {
    //   state.loading = true
    //   state.error = null
    // },
    // [deleteResourceById.fulfilled]: (state) => {
    //   state.loading = false
    // },
    // [deleteResourceById.rejected]: (state, { payload }) => {
    //   state.loading = false
    //   state.error = payload
    // }
  }
})

export const { setStateResourceValue } = resourcesSlice.actions;

export default resourcesSlice.reducer;
