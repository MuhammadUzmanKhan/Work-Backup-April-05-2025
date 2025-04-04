import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { CardsContext } from 'layouts/productsLayout/ProductsLayout';
import { BackgroundContext } from 'layouts/historyLayout/HistoryLayout';
import { ReactComponent as NoResultsImg } from 'assets/images/no-results-img.svg';
import DefaultProductView from 'views/Product/DefaultProductView';
import SearchFilter from 'views/Products/SearchFilter';
// import FilterList from 'views/Filters/FilterList';
import AsideFilter from 'views/Filters/AsideFilter';
import AsideSimpleFilter from 'views/Filters/AsideSimpleFilter';
import palette from 'theme/palette';
import styles from './cards.module.scss';
import {
  selectCategory,
  selectTag,
  selectProductCategory,
  selectSelectedCategory,
  selectProducts,
  selectSelectedTag
} from 'store/reducers/products';
import { fetchProducts, setSearchFilter } from 'store/actions/products';
import PageLoading from 'components/PageLoading';
import { debounce } from 'lodash';

export default function ProductsItems() {
  let params = useParams();
  const [, setVal] = useContext(BackgroundContext);
  const [, setCardsVal] = useContext(CardsContext);
  const [searchValue, setSearchValue] = useState('');
  const [statusAside, setStatusAside] = useState(false);
  const [statusSimpleFilterAside, setStatusSimpleFilterAside] = useState(false);
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.products.loaders.products);
  const navigate = useNavigate();

  let [searchParams] = useSearchParams();

  const onSetFilters = () => {};
  const onResetFilters = () => {};
  const selectedCategory = useSelector(selectSelectedCategory);
  const selectedTag = useSelector(selectSelectedTag);
  const categoryList = useSelector(selectProductCategory);
  const products = useSelector(selectProducts);
  const isEmpty = products.length;

  useEffect(() => {
    if (Object.values(selectedCategory).length <= 1) {
      const category = categoryList.find((item) => item.type === params.category);
      if (category) {
        dispatch(selectCategory(category));
        const tag = category.tags.find((item) => item.type === params.product);
        tag && dispatch(selectTag(tag));
        tag && setCardsVal({ title: tag.name });
      }
    }
  }, [selectedCategory, categoryList]);

  useEffect(() => {
    selectedCategory.id &&
      dispatch(fetchProducts({ categoryId: selectedCategory.id, tagId: selectedTag.id }));
  }, [selectedCategory, selectedTag]);

  useEffect(() => {
    setVal({ background: 'none', isWhite: false });
    setCardsVal({ title: selectedCategory.name });
    if (searchParams.get('isFilters')) {
      setStatusSimpleFilterAside(true);
    }
  }, []);

  const entries = Object.entries(selectedCategory.filter || {});

  const filterData = entries.reduce((acc, [type, value]) => {
    value.forEach((v) => {
      if (type === 'productFilterQnAs' && v.answerType === 'MULTIPLE') {
        acc[v.displayIndex] = [];
      } else if (type === 'productFilterQnAs' && v.answerType === 'SINGLE') {
        acc[v.displayIndex] = '';
      } else if (type === 'productFilterRanges') {
        acc[v.displayIndex] = v.lower;
      } else if (type === 'productFilterCheckBoxes') {
        acc[v.displayIndex] = false;
      } else {
        acc[v.displayIndex] = '';
      }
    });
    return acc;
  }, {});

  const dataItems = entries.reduce((acc, [key, value]) => {
    acc.push(...value.map((v) => ({ ...v, key })));
    return acc;
  }, []);

  const debounceFn = useCallback(
    debounce((value) => dispatch(setSearchFilter(value)), 600),
    []
  );

  const handleSearch = (value) => {
    setSearchValue(value);
    debounceFn(value);
  };

  return (
    <Grid container>
      <Grid xs={12} item>
        <SearchFilter
          setStatusAside={setStatusAside}
          className={styles.searchFilter}
          value={searchValue}
          onChange={handleSearch}
        />
      </Grid>
      {/*<Grid xs={12} item>*/}
      {/*  <FilterList onResetFilters={onResetFilters} />*/}
      {/*</Grid>*/}

      <Grid item sx={{ width: '100%', marginTop: '16px' }}>
        {isEmpty ? (
          <React.Fragment>
            {products.map((product) => (
              <DefaultProductView
                item={product}
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
              />
            ))}
          </React.Fragment>
        ) : (
          <Box sx={{ marginTop: '69px' }}>
            <Grid container>
              <Grid item xs={12} sx={{ marginBottom: '26px' }} textAlign="center">
                <Typography variant="subtitle1" color={palette.variables.greyLight}>
                  No Results
                </Typography>
              </Grid>
              <Grid item xs={12} textAlign="center">
                <NoResultsImg />
              </Grid>
            </Grid>
          </Box>
        )}
      </Grid>
      <AsideFilter
        initialData={filterData}
        dataItems={dataItems}
        data={selectedCategory.filter}
        onSetFilters={onSetFilters}
        onResetFilters={onResetFilters}
        status={statusAside}
        onChange={(val) => setStatusAside(val)}
      />
      <AsideSimpleFilter
        status={statusSimpleFilterAside}
        onSubmit={() => {
          setStatusSimpleFilterAside(false);
          setStatusAside(true);
        }}
        onChange={(val) => setStatusSimpleFilterAside(val)}
      />
      <PageLoading loading={loading} />
    </Grid>
  );
}
