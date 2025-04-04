import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useParams } from 'react-router-dom'
import { Box, CardMedia, Grid, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Formik } from 'formik'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import styles from '../admin.module.scss'
import { fetchCategory } from 'store/actions/products'
import { fetchPartnerById } from 'store/actions/partners'
import PageLoading from 'components/PageLoading'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import palette from 'theme/palette'

const PartnerPublishedView = () => {
  const { id } = useParams()
  const { pathname } = useLocation()
  const isPublished = pathname.split('/').at(-1) === 'published'
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const { productCategory } = useSelector((state) => state.products)
  const { partner, isLoading, error } = useSelector((state) => state.partners)
  const lang = useSelector(selectLanguage)

  useEffect(() => {
    dispatch(fetchCategory())
    return async () => await dispatch(setLanguage('en'))
  }, [])

  useEffect(() => {
    if (id) dispatch(fetchPartnerById({ id: isPublished ? `${id}/published` : id }))
  }, [lang])

  const initialState = {
    name: error && lang === 'ar' ? '' : partner?.name || '',
    shortName: error && lang === 'ar' ? '' : partner?.shortName || '',
    logo: partner?.logoUrl || '',
    products: partner?.categoryIds || []
  }

  return (
    <Box className={styles.cardPartner}>
      {isLoading ? (
        <PageLoading loading={isLoading} />
      ) : (
        <Grid item md={6} xs={12} p={3}>
          <Formik initialValues={initialState}>
            {({ values, errors }) => (
              <form>
                <Box
                  display={'flex'}
                  justifyContent={partner?.metaInfo ? 'space-between' : 'flex-end'}>
                  {partner?.metaInfo && (
                    <Typography
                      sx={{ marginBottom: '16px' }}
                      component="h2"
                      variant="h3"
                      color={palette.variables.darkPurple}>
                      {isPublished
                        ? `Published Version ${partner?.metaInfo?.publishedVersion}`
                        : `Current Version ${partner?.metaInfo?.version}`}
                    </Typography>
                  )}
                  <ToggleButton
                    sx={{
                      display: 'flex',
                      gap: '8px',
                      overflow: 'auto',
                      marginBottom: '15px',
                      flexWrap: 'nowrap',
                      width: 'max-content'
                    }}
                    selected={lang !== 'en'}
                    onChange={() => {
                      dispatch(setLanguage(lang === 'en' ? 'ar' : 'en'))
                      // setIsArabic(!isArabic)
                    }}
                    value={'check'}>
                    {lang !== 'en' ? 'English' : 'Arabic'}
                  </ToggleButton>
                </Box>

                <Box component="div">
                  <BaseTextField
                    InputLabelProps={{ required: false }}
                    sx={{ marginBottom: '24px' }}
                    margin="normal"
                    fullWidth
                    id="name"
                    label={t('fields.name')}
                    name="name"
                    disabled={true}
                    value={values.name}
                    color={!errors.name && values.name ? 'success' : ''}
                  />
                  <BaseTextField
                    InputLabelProps={{ required: false }}
                    sx={{ marginBottom: '24px' }}
                    margin="normal"
                    fullWidth
                    id="shortName"
                    label={t('fields.shortName')}
                    name="shortName"
                    disabled={true}
                    value={values.shortName}
                    color={!errors.shortName && values.shortName ? 'success' : ''}
                  />
                  <Box>
                    <Box>
                      {values.logo && (
                        <CardMedia
                          style={{
                            cursor: 'pointer',
                            objectFit: 'scale-down',
                            marginBottom: '20px'
                          }}
                          component="img"
                          height="50"
                          image={
                            typeof values.logo === 'string'
                              ? values.logo
                              : URL.createObjectURL(values.logo)
                          }
                          alt="Exprot image"
                          sx={{ maxWidth: '50px', borderRadius: 1 }}
                        />
                      )}
                    </Box>

                    <Typography component="div" variant="bodyBig" color="common.darkPurple" mb={3}>
                      {t('admin.products')}
                    </Typography>

                    <ToggleButtonGroup
                      disabled={true}
                      sx={{ flexWrap: 'wrap', gap: '7px' }}
                      color="primary"
                      value={values.products}>
                      {productCategory?.map((product) => (
                        <ToggleButton
                          sx={{
                            display: 'flex',
                            gap: '8px',
                            overflow: 'auto',
                            marginBottom: '15px',
                            flexWrap: 'nowrap',
                            width: 'max-content'
                          }}
                          key={product.id}
                          value={product.id}>
                          {product.name}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Box>
                </Box>
              </form>
            )}
          </Formik>
        </Grid>
      )}
    </Box>
  )
}

export default PartnerPublishedView
