import { createAsyncThunk } from '@reduxjs/toolkit';
import ProductProvider from 'services/ProductProviderService';
import ProductCategory from 'services/ProductCategoryService';
import Product from 'services/ProductService';
import { saveFilters, setSearchProduct } from 'store/reducers/products';
import { failureToast } from 'utils'

export const fetchProvider = createAsyncThunk(
  'products/fetchProvider',
  async (params, thunkAPI) => {
    try {
      const response = await ProductProvider.getDataList({ params })
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message.original)
    }
  }
)
export const fetchCategory = createAsyncThunk(
  'products/fetchCategory',
  async (params, thunkAPI) => {
    try {
      const response = await ProductCategory.getDataList({ params })

      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message.original)
    }
  }
)

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params, thunkAPI) => {
    try {
      const response = await Product.getCategoryProducts({ params })
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message.original)
    }
  }
)

export const setSearchFilter = createAsyncThunk(
  'products/setSearchFilter',
  async (params, thunkAPI) => {
    try {
      await thunkAPI.dispatch(setSearchProduct(params))
      await thunkAPI.dispatch(searchProduct())
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message.original)
    }
  }
)

export const setFilters = createAsyncThunk('products/setSearchFilter', async (params, thunkAPI) => {
  try {
    await thunkAPI.dispatch(saveFilters(params))
    await thunkAPI.dispatch(searchProduct())
  } catch (err) {
    if (!err.message) {
      throw err
    }
    return thunkAPI.rejectWithValue(err.message.original)
  }
})

export const searchProduct = createAsyncThunk(
  'products/searchProduct',
  async (params = {}, thunkAPI) => {
    try {
      const { products } = thunkAPI.getState()
      // const answers = products.filters
      //   .filter((f) => Array.isArray(f.tag))
      //   .reduce((acc, curr) => {
      //     acc.push(...curr.tag.map((t) => t.answer));
      //     acc.push(...curr.tag);
      //     return acc;
      //   }, []);

      const filters = {
        name: products.search,
        // providerId: products.productProvider[0].id,
        categoryId: products.selectedCategory.id,
        // filterTags: [...products.filters.map((f) => f.tag.id).filter((f) => f), ...answers],
        filterTags: products.filters.map((f) => f.tag?.id).filter((f) => f)
        // answers: answers,
        // tags: [products.selectedTag.id]
      }

      const response = await Product.searchProduct({ params: { ...params, ...filters } })

      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message.original)
    }
  }
)

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (params, thunkAPI) => {
    try {
      const response = await Product.getDataById({ params })
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)

export const editProductById = createAsyncThunk(
  'products/editProduct',
  async (params, thunkAPI) => {
    try {
      const response = await Product.editDataById({ params })
      if (params.cb) params.cb(response)

      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      failureToast(`Product could not be updated.  ${err.msg}`)
      return thunkAPI.rejectWithValue(err.message.original)
    }
  }
)

export const createNewProduct = createAsyncThunk(
  'products/setProduct',
  async (params, thunkAPI) => {
    try {
      const response = await Product.postData({ params: params.params })
      if (params.cb) params.cb(response)
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      failureToast(`Product could not be created.  ${err.msg}`)
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)

export const fetchCategoryById = createAsyncThunk(
  'products/fetchCategoryById',
  async (params, thunkAPI) => {
    try {
      const response = await ProductCategory.getDataById({ params })

      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)

export const setProductCategorys = createAsyncThunk(
  'products/setProductCategorys',
  async (params, thunkAPI) => {
    try {
      const response = await ProductCategory.postData({ params: params.params })
      if (params.cb) params.cb(response)
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      failureToast(`Product could not be created.  ${err.msg}`)

      return thunkAPI.rejectWithValue(err.message.original)
    }
  }
)

export const editCategoryById = createAsyncThunk(
  'products/setProductCategorys',
  async (params, thunkAPI) => {
    try {
      const response = await ProductCategory.editDataById({ params })
      if (params.cb) params.cb(response)
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      failureToast(`Category could not be updated.  ${err.msg}`)

      return thunkAPI.rejectWithValue(err.message.original)
    }
  }
)

export const fetchCategorySummary = createAsyncThunk(
  'products/fetchCategorySummary',
  async (params, thunkAPI) => {
    try {
      const response = await ProductCategory.getDataById({ params })

      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)

export const deleteProductById = createAsyncThunk(
  'products/deleteProductById',
  async (params, thunkAPI) => {
    try {
      const response = await Product.deleteDataById({ params })
      if (params.cb) params.cb()
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      if (params.cbf) params.cbf()
      failureToast(`Product could not be deleted.`)

      return thunkAPI.rejectWithValue(err.message)
    }
  }
)

export const fetchCategoryLinksById = createAsyncThunk(
  'products/fetchCategoryLinksById',
  async (params, thunkAPI) => {
    try {
      const response = await ProductCategory.getDataById({ params })

      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)

export const deleteCategoryById = createAsyncThunk(
  'products/deleteProductCategory',
  async (params, thunkAPI) => {
    try {
      const response = await ProductCategory.deleteDataById({ params })
      if (params.cb) params.cb()
      return response
    } catch (err) {
      if (!err.message) {
        throw err
      }
      failureToast(`Category could not be updated.  ${err.msg}`)
      if (params.cbf) params.cbf()
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)