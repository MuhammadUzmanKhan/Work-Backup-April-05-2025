import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Grid, Typography } from '@mui/material';

import ItemDashboard from 'views/Admin/Dashboard/ItemDashboard'

import styles from '../admin.module.scss'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCategory } from 'store/actions/products'

const FilterPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { productCategory } = useSelector((state) => state.products)

  useEffect(() => {
    dispatch(fetchCategory())
  }, [])

  // const onCreateFilter = () => {
  //   navigate('/filter/0');
  // };

  return (
    <Box className={styles.container}>
      <Grid container alignItems="center" justifyContent="space-between" mb={3}>
        <Grid item>
          <Typography variant="h3" mt={3}>
            {t('admin.filters')}
          </Typography>
        </Grid>

        {/* <Grid item sx={{ display: 'flex', alignItems: 'end' }}>
          <BaseButton
            customColor={palette.variables.orange}
            variant="contained"
            element={t('add')}
            sx={{ display: 'block', maxWidth: 300, height: 'max-content', marginLeft: 3 }}
            onClick={onCreateFilter}
          />
        </Grid> */}
      </Grid>

      <Grid container spacing={2} alignItems="stretch">
        {productCategory
          ?.map((item) => ({ name: item.name, icon: item.iconUrl, id: item.id }))
          .map((item) => (
            <Grid item md={4} xs={6} key={item.id}>
              <ItemDashboard item={item} onClick={() => navigate(`/filter/${item.id}`)} />
            </Grid>
          ))}
      </Grid>
    </Box>
  )
}

export default FilterPage;
