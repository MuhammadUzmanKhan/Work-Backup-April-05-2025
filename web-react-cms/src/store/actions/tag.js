import { createAsyncThunk } from '@reduxjs/toolkit';
import TagService from 'services/TagFaqService';
import TagsCategoryService from 'services/TagsCategoryService';
import TagsFilterService from 'services/TagsFilterService';
import PrimaryTagsProductService from 'services/PrimaryTagsProductService';
import TagsQuizzesService from 'services/TagsQuizzesService';
import TagsRewardsService from 'services/TagsRewardsService';
import FilterTagsProductService from 'services/FilterTagsProductService';
import { failureToast } from 'utils';

export const postCategoryTags = createAsyncThunk(
  'tag/postCategoryTags',
  async (params, thunkAPI) => {
    try {
      const response = await TagsCategoryService.setDataList({ params: params.params });
      if (params.cb) params.cb(response);

      return response;
    } catch (err) {
      if (!err.message) {
        throw err;
      }
      failureToast('Product tag could not be created');

      return thunkAPI.rejectWithValue(err.message.original);
    }
  }
);

export const postRewardsTags = createAsyncThunk(
  'tag/postCategoryTags',
  async (params, thunkAPI) => {
    try {
      const response = await TagsRewardsService.setDataList({ params: params.params });
      if (params.cb) params.cb(response);
      return response;
    } catch (err) {
      if (!err.message) {
        throw err;
      }
      failureToast('Reward tag could not be created');

      return thunkAPI.rejectWithValue(err.message.original);
    }
  }
);

export const getRewardsTags = createAsyncThunk('tag/getCategoryTags', async (params, thunkAPI) => {
  try {
    const response = await TagsRewardsService.getDataList({ params });

    return response;
  } catch (err) {
    if (!err.message) {
      throw err;
    }
    return thunkAPI.rejectWithValue(err.message.original);
  }
});

export const editRewardsTags = createAsyncThunk(
  'tag/editCategoryTags',
  async (params, thunkAPI) => {
    try {
      const response = await TagsRewardsService.editDataById({ params });
      if (params.cb) params.cb(response);

      return response;
    } catch (err) {
      if (!err.message) {
        throw err;
      }
      failureToast('Reward could not be updated');
      return thunkAPI.rejectWithValue(err.message.original);
    }
  }
);

export const getRewardByID = createAsyncThunk('tag/getRewardByID', async (params, thunkAPI) => {
  try {
    const response = await TagsRewardsService.getDataById({ params });

    return response;
  } catch (err) {
    if (!err.message) {
      throw err;
    }
    return thunkAPI.rejectWithValue(err.message.original);
  }
});

export const postFilterTags = createAsyncThunk('tag/postFilterTags', async (params, thunkAPI) => {
  try {
    const response = await TagsFilterService.setDataList({ params: params.params });
    if (params.cb) params.cb(response);

    return response;
  } catch (err) {
    if (!err.message) {
      throw err;
    }
    failureToast('Filter tag could not be created');

    return thunkAPI.rejectWithValue(err.message.original);
  }
});

export const getFilterTags = createAsyncThunk('tag/getCategoryTags', async (params, thunkAPI) => {
  try {
    const response = await TagsFilterService.getDataList({ params });

    return response;
  } catch (err) {
    if (!err.message) {
      throw err;
    }
    return thunkAPI.rejectWithValue(err.message.original);
  }
});

export const getFilterTagsById = createAsyncThunk(
  'tag/getCategoryTagsById',
  async (params, thunkAPI) => {
    try {
      const response = await TagsFilterService.getDataById({ params });

      return response;
    } catch (err) {
      if (!err.message) {
        throw err;
      }
      return thunkAPI.rejectWithValue(err.message.original);
    }
  }
);
export const editFilterTags = createAsyncThunk('tag/editFilterTags', async (params, thunkAPI) => {
  try {
    const response = await TagsFilterService.editDataById({ params });
    if (params.cb) params.cb(response);
    return response;
  } catch (err) {
    if (!err.message) {
      throw err;
    }
    failureToast('Filter tag could not be updated');

    return thunkAPI.rejectWithValue(err.message.original);
  }
});

export const editCategoryTags = createAsyncThunk(
  'tag/editCategoryTags',
  async (params, thunkAPI) => {
    try {
      const response = await TagsCategoryService.editDataById({ params });
      if (params.cb) params.cb(response);

      return response;
    } catch (err) {
      if (!err.message) {
        throw err;
      }
      failureToast('Product tag could not be updated');
      return thunkAPI.rejectWithValue(err.message.original);
    }
  }
);

export const getCategoryTags = createAsyncThunk('tag/getCategoryTags', async (params, thunkAPI) => {
  try {
    const response = await TagsCategoryService.getDataList({ params });

    return response;
  } catch (err) {
    if (!err.message) {
      throw err;
    }
    return thunkAPI.rejectWithValue(err.message.original);
  }
});

export const getCategoryTagsById = createAsyncThunk(
  'tag/getCategoryTagsById',
  async (params, thunkAPI) => {
    try {
      const response = await TagsCategoryService.getDataById({ params });

      return response;
    } catch (err) {
      if (!err.message) {
        throw err;
      }
      return thunkAPI.rejectWithValue(err.message)
    }
  }
);

export const postQizzesTags = createAsyncThunk('tag/postQizzesTags', async (params, thunkAPI) => {
  try {
    const response = await TagsQuizzesService.setDataList({ params: params.params });
    if (params.cb) params.cb(response);

    return response;
  } catch (err) {
    if (!err.message) {
      throw err;
    }
    failureToast('Quiz tag could not be created');

    return thunkAPI.rejectWithValue(err.message.original);
  }
});

export const getQizzesTags = createAsyncThunk('tag/getQizzesTags', async (params, thunkAPI) => {
  try {
    const response = await TagsQuizzesService.getDataList({ params });

    return response;
  } catch (err) {
    if (!err.message) {
      throw err;
    }

    return thunkAPI.rejectWithValue(err.message.original);
  }
});

export const editQizzesTags = createAsyncThunk('tag/editTags', async (params, thunkAPI) => {
  try {
    const response = await TagsQuizzesService.editDataById({ params });
    if (params.cb) params.cb(response);

    return response;
  } catch (err) {
    if (!err.message) {
      throw err;
    }
    failureToast('Quiz tag could not be updated');

    return thunkAPI.rejectWithValue(err.message.original);
  }
});

export const getQuizByID = createAsyncThunk('tag/editTags', async (params, thunkAPI) => {
  try {
    const response = await TagsQuizzesService.getDataById({ params });

    return response;
  } catch (err) {
    if (!err.message) {
      throw err;
    }
    return thunkAPI.rejectWithValue(err.message.original);
  }
});

export const getPrimaryProductTags = createAsyncThunk(
  'tag/getProductTags',
  async (params, thunkAPI) => {
    try {
      const response = await PrimaryTagsProductService.getDataList({ params });

      return response;
    } catch (err) {
      if (!err.message) {
        throw err;
      }
      return thunkAPI.rejectWithValue(err.message.original);
    }
  }
);

export const getFilterProductTags = createAsyncThunk(
  'tag/getProductTags',
  async (params, thunkAPI) => {
    try {
      const response = await FilterTagsProductService.getDataList({ params });

      return response;
    } catch (err) {
      if (!err.message) {
        throw err;
      }
      return thunkAPI.rejectWithValue(err.message.original);
    }
  }
);

export const getTags = createAsyncThunk('faqs/getTags', async (params, thunkAPI) => {
  try {
    const response = await TagService.getDataList({ params })
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    return thunkAPI.rejectWithValue(err.message.original)
  }
})

export const postTags = createAsyncThunk('tag/postTags', async (params, thunkAPI) => {
  try {
    const response = await TagService.setDataList({ params: params.params })
    if (params.cb) params.cb(response)
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    failureToast('Faq tag could not be created')

    return thunkAPI.rejectWithValue(err.message.original)
  }
})

export const editTags = createAsyncThunk('tag/editTags', async (params, thunkAPI) => {
  try {
    const response = await TagService.editDataById({ params })
    if (params.cb) params.cb(response)
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    failureToast('Faq tag could not be updated')

    return thunkAPI.rejectWithValue(err.message.original)
  }
})

export const getTagsByID = createAsyncThunk('tag/editTags', async (params, thunkAPI) => {
  try {
    const response = await TagService.getDataById({ params })

    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    return thunkAPI.rejectWithValue(err.message.original)
  }
})

export const deleteTagsByID = createAsyncThunk('tag/deleteTags', async (params, thunkAPI) => {
  try {
    let response
    switch (params.type) {
      case 'FAQ':
        response = await TagService.deleteDataById({ params })
        break
      case 'Quiz':
        response = await TagsQuizzesService.deleteDataById({ params })
        break
      case 'Reward':
        response = await TagsRewardsService.deleteDataById({ params })
        break
      case 'Filter':
        response = await TagsFilterService.deleteDataById({ params })
        break
      case 'Product':
        response = await TagsCategoryService.deleteDataById({ params })
        break
      default:
        break
    }
    if (params.cb) params.cb()
    return response
  } catch (err) {
    if (!err.message) {
      throw err
    }
    failureToast('Tag could not be deleted')
    if (params.cbF) params.cbF()
    return thunkAPI.rejectWithValue(err.message)
  }
})
