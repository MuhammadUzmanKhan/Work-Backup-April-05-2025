import React, { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Grid, Typography } from '@mui/material';

import PartnerItem from 'views/Admin/Categories/Partners/PartnerItem';
import SearchFilter from 'views/Products/SearchFilter';
import BaseButton from 'components/formControl/baseButton/BaseButton';

// import { partnersList } from 'utils/fakeValues';

import palette from 'theme/palette';
import styles from '../admin.module.scss';
import { fetchCategoryById, fetchProducts, searchProduct } from 'store/actions/products';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchProduct, setStateProductValue } from 'store/reducers/products';
import { Permissions } from 'components/Permissions'

const SpecificProducts = () => {
  const navigate = useNavigate();
  const { categoryId, providerId, tagId } = useParams();
  const dispatch = useDispatch();

  const { t } = useTranslation();

  const [searchParams] = useSearchParams();

  const { products } = useSelector((state) => state.products);
  const { selectedCategory } = useSelector((state) => state.products);

  const onCreateProduct = () => {
    navigate(`/products/create/0/category/${selectedCategory.id}`, { state: { providerId } })
  };

  const onEditProduct = (id) => {
    navigate(`/products/${id}`, { state: { categoryId } });
  };

  useEffect(async () => {
    searchParams.set('categoryId', categoryId);
    if (providerId) searchParams.set('providerId', providerId);
    if (tagId) searchParams.set('tagId', tagId);
    dispatch(fetchProducts({ queryParams: searchParams.toString() }));
    const data = await dispatch(fetchCategoryById({ id: categoryId }));
    dispatch(setStateProductValue({ type: 'selectedCategory', data: data.payload }));
  }, []);

  const handleSearch = (value) => {
    dispatch(setSearchProduct(value));
    const params = {
      filterTags: [],
      tags: []
    };
    if (providerId) params.providerId = providerId;
    if (tagId) params.tags.push(tagId);
    dispatch(searchProduct(params));
  };

  return (
    <Box className={styles.cardPartner}>
      <Grid container alignItems="center" justifyContent="space-between" mb={3}>
        <Grid item>
          <Typography variant="h3" mt={3}>
            {selectedCategory?.name}
          </Typography>
        </Grid>

        <Grid item sx={{ display: 'flex', alignItems: 'end' }}>
          <SearchFilter onChange={handleSearch} withFilter={false} />
          <Permissions permission={'write:product'}>
            <BaseButton
              customColor={palette.variables.orange}
              variant="contained"
              element={t('add')}
              sx={{ display: 'block', maxWidth: 300, height: 'max-content', marginLeft: 3 }}
              onClick={onCreateProduct}
            />
          </Permissions>
        </Grid>
      </Grid>

      <Grid container spacing={2} direction="column">
        {products?.length > 0 &&
          products
            .map((item) => ({ name: item.name, logoUrl: item.imageUrl, id: item.id }))
            .map((item) => (
              <Grid item md={4} xs={6} key={item.id}>
                <PartnerItem item={item} onClick={() => onEditProduct(item.id)} />
              </Grid>
            ))}
      </Grid>
    </Box>
  )
};

export default SpecificProducts;
