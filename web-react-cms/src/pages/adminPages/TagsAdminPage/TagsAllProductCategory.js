import React, { useEffect } from 'react'
import { Box, Grid, Link, Typography } from '@mui/material'
import ItemDashboard from 'views/Admin/Dashboard/ItemDashboard'
import { useDispatch, useSelector } from 'react-redux'
import { Link as Route } from 'react-router-dom'
import { fetchCategory } from 'store/actions/products'
import { useTranslation } from 'react-i18next'

const TagsAllProductCategory = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const { productCategory } = useSelector((state) => state.products)
  useEffect(() => {
    dispatch(fetchCategory())
  }, [])

  return (
    <>
      <Box>
        <Typography variant="h3">{t('admin.tags')}</Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            mt: 3
          }}>
          <Typography>{t('admin.productCategory')}</Typography>
        </Box>
        <Grid container spacing={2} alignItems="stretch">
          {productCategory
            ?.map(({ id, name, iconUrl }) => ({ id, name, icon: iconUrl }))
            .map((item) => (
              <Grid item md={4} xs={6} key={item.id}>
                <Link
                  component={Route}
                  to={`/tags/product/${item.id}`}
                  color="#000000"
                  underline="none">
                  <ItemDashboard item={item} />
                </Link>
              </Grid>
            ))}
        </Grid>
      </Box>
    </>
  )
}

export default TagsAllProductCategory
