import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Grid, Typography } from '@mui/material';

import ProductCategoryItem from 'views/Admin/Categories/ProductCategory/ProductCategoryItem';
import BaseButton from 'components/formControl/baseButton/BaseButton';

import { fetchCategory } from 'store/actions/products';
// import { setStateProductValue } from 'store/reducers/products';

import palette from 'theme/palette';
import styles from '../admin.module.scss';
import { Permissions } from 'components/Permissions'

const ProductCategoryAdminPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { productCategory } = useSelector((state) => state.products)

  const onGoToCategory = (category) => {
    // dispatch(setStateProductValue({ type: 'selectedCategory', data: category }));
    navigate(`/product-category/${category.id}`)
  }

  const onCreateCategory = () => {
    navigate('/product-category/0')
  }

  useEffect(() => {
    dispatch(fetchCategory())
  }, [])

  return (
    <Box className={styles.container}>
      <Grid container alignItems="center" justifyContent="space-between" mb={3}>
        <Grid item>
          <Typography variant="h3" mt={3}>
            {t('admin.productCategory')}
          </Typography>
        </Grid>

        <Grid item sx={{ display: 'flex', alignItems: 'end' }}>
          <Permissions permission={'write:category'}>
            <BaseButton
              customColor={palette.variables.orange}
              variant="contained"
              element={t('add')}
              sx={{ display: 'block', maxWidth: 300, height: 'max-content', marginLeft: 3 }}
              onClick={onCreateCategory}
            />
          </Permissions>
        </Grid>
      </Grid>

      <Grid container spacing={2} direction="column">
        {productCategory?.map((item) => (
          <Grid item md={4} xs={6} key={item.id}>
            <ProductCategoryItem item={item} onClick={() => onGoToCategory(item)} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default ProductCategoryAdminPage;
