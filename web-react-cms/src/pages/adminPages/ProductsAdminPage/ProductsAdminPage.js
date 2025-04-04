import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Grid, Typography } from '@mui/material';

import ItemDashboard from 'views/Admin/Dashboard/ItemDashboard';
import BaseButton from 'components/formControl/baseButton/BaseButton';

import { fetchCategorySummary } from 'store/actions/products'

import palette from 'theme/palette';
import styles from '../admin.module.scss';
import { Permissions } from 'components/Permissions'

const ProductsAdminPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { productCategory } = useSelector((state) => state.products)

  useEffect(() => {
    dispatch(fetchCategorySummary({ id: 'summary' }))
  }, [])

  const onGoToCategoryProducts = (category) => {
    navigate(`/products/category/${category.id}`)
  }

  const onCreateProduct = () => {
    navigate('/products/0')
  }

  return (
    <Box className={styles.container}>
      <Grid container alignItems="center" justifyContent="space-between" mb={3}>
        <Grid item>
          <Typography variant="h3" mt={3}>
            {t('admin.products')}
          </Typography>
        </Grid>

        <Grid item sx={{ display: 'flex', alignItems: 'end' }}>
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

      <Grid container spacing={2} alignItems="stretch">
        {productCategory
          ?.map((item) => ({ name: item.name, icon: item.iconUrl, id: item.id }))
          .map((item) => (
            <Grid item md={4} xs={6} key={item.id}>
              <ItemDashboard item={item} onClick={() => onGoToCategoryProducts(item)} />
            </Grid>
          ))}
      </Grid>
    </Box>
  )
}

export default ProductsAdminPage;
