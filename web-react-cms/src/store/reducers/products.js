import { createSlice } from '@reduxjs/toolkit';
import { ProductsAdapter } from 'models/adapters/ProductsAdapter';
import {
  fetchCategory,
  fetchProductById,
  fetchProducts,
  fetchProvider,
  searchProduct,
  fetchCategorySummary
} from 'store/actions/products'

const initialState = {
  search: '',
  filters: [],
  productProvider: [],
  productCategory: [],
  categories: [],
  products: [],
  product: {},
  primaryProductTags: [],
  filterProductTags: [],
  selectedCategory: {
    tags: []
  },
  selectedTag: {},
  loaders: {
    products: false,
    category: false,
    provider: false,
    product: false
  },
  error: null
}

export const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    saveFilters: (state, { payload }) => {
      state.filters = payload
    },
    removeFilter: (state, { payload: { index, key } }) => {
      if (key) {
        const ind = state.filters.findIndex((f) => f.key === key)
        state.filters[ind].value.splice(index, 1)
        state.filters[ind].label.splice(index, 1)
        if (!state.filters[ind].value.length) {
          state.filters.splice(ind, 1)
        }
      } else {
        state.filters.splice(index, 1)
      }
    },
    removeAllFilters: (state) => {
      state.filters = []
    },
    selectCategory: (state, { payload }) => {
      state.selectedCategory = ProductsAdapter.mapProductCategoryDtoToProductCategoryModel(payload)
    },
    selectTag: (state, { payload }) => {
      state.selectedTag = payload
    },
    setSearchProduct: (state, { payload }) => {
      state.search = payload
    },
    setStateProductValue(state, { payload }) {
      return {
        ...state,
        [payload.type]: payload.data
      }
    }
  },
  extraReducers: {
    [fetchProvider.pending]: (state) => {
      state.loaders.provider = true
      state.error = null
    },
    [fetchProvider.fulfilled]: (state, { payload }) => {
      state.productProvider = payload
      state.loaders.provider = false
    },
    [fetchProvider.rejected]: (state, { payload }) => {
      state.loaders.provider = false
      state.error = payload
    },
    [fetchCategory.pending]: (state) => {
      state.loaders.category = true
      state.error = null
    },
    [fetchCategory.fulfilled]: (state, { payload }) => {
      state.productCategory = payload
      state.loaders.category = false
    },
    [fetchCategory.rejected]: (state, { payload }) => {
      state.loaders.category = false
      state.error = payload
    },
    [fetchProducts.pending]: (state) => {
      state.loaders.products = true
      state.error = null
    },
    [fetchProducts.fulfilled]: (state, { payload }) => {
      state.products = payload
      state.loaders.products = false
    },
    [fetchProducts.rejected]: (state, { payload }) => {
      state.loaders.products = false
      state.error = payload
    },
    [fetchProductById.pending]: (state) => {
      state.loaders.product = true
      state.error = null
    },
    [fetchProductById.fulfilled]: (state, { payload }) => {
      state.product = payload
      state.loaders.product = false
    },
    [fetchProductById.rejected]: (state, { payload }) => {
      state.loaders.product = false
      state.error = payload
    },
    [searchProduct.pending]: (state) => {
      state.loaders.product = true
      state.error = null
    },
    [searchProduct.fulfilled]: (state, { payload }) => {
      state.products = payload
      state.loaders.products = false
    },
    [searchProduct.rejected]: (state, { payload }) => {
      state.loaders.products = false
      state.error = payload
    },
    [fetchCategorySummary.pending]: (state) => {
      state.loaders.category = true
      state.error = null
    },
    [fetchCategorySummary.fulfilled]: (state, { payload }) => {
      state.productCategory = payload
      state.loaders.category = false
    },
    [fetchCategorySummary.rejected]: (state, { payload }) => {
      state.loaders.category = false
      state.error = payload
    }
  }
})
export const selectFilters = (state) => state.products.filters;
export const selectProductCategory = (state) => state.products.productCategory;
export const selectSelectedCategory = (state) => state.products.selectedCategory;
export const selectSelectedTag = (state) => state.products.selectedTag;
export const selectProducts = (state) => state.products.products;
export const selectProduct = (state) => state.products.product;

export const {
  saveFilters,
  removeFilter,
  removeAllFilters,
  setProductProvider,
  setProductCategory,
  setProducts,
  setProduct,
  selectCategory,
  selectTag,
  setLoader,
  setSearchProduct,
  setStateProductValue
} = productsSlice.actions;

export default productsSlice.reducer;
