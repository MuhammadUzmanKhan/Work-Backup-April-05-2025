import React, { useEffect } from 'react'
import { Box, Grid, Link, Typography } from '@mui/material'
import ItemDashboard from 'views/Admin/Dashboard/ItemDashboard'
import { useDispatch, useSelector } from 'react-redux'
import { Link as Route } from 'react-router-dom'
import { fetchCategory } from 'store/actions/products'
import { useTranslation } from 'react-i18next'

const TagsAdminPage = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const { productCategory } = useSelector((state) => state.products)
  useEffect(() => {
    dispatch(fetchCategory())
  }, [])
  const tags = [
    { name: 'quizzes', link: '/tags/quizzes' },
    { name: 'faqs', link: '/tags/faq' },
    { name: 'rewards', link: '/tags/reward' },
    { name: 'filterTags', link: '/tags/filter' }
  ]

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
          <Typography style={{ fontWeight: 500 }}>{t('admin.productCategory')}</Typography>
        </Box>
        <Grid container spacing={2} alignItems="stretch">
          {productCategory
            .slice(0, 6)
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
        <Typography variant="subtitle1" sx={{ mt: 3 }} align="center" component="h4">
          <Link component={Route} to="/tags/products" color="#000000" underline="none">
            {t('viewAll')}
          </Link>
        </Typography>
      </Box>
      <Typography mt={10} mb={3} style={{ fontWeight: 500 }}>
        {t('admin.allTags')}
      </Typography>

      <Grid container spacing={2} alignItems="stretch">
        {tags.map((item) => (
          <Grid item md={4} xs={6} key={item.name}>
            <Link component={Route} to={`${item.link}`} color="#000000" underline="none">
              <ItemDashboard item={item} translate={true} />
            </Link>
          </Grid>
        ))}
      </Grid>
    </>
  )
}

export default TagsAdminPage
