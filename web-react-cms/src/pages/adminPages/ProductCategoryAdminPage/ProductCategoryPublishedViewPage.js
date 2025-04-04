import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Grid,
  Checkbox,
  FormGroup,
  FormControlLabel,
  ToggleButton
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Formik } from 'formik'
import BaseTextarea from 'components/formControl/baseTextarea/BaseTextarea'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'

import { fetchCategoryById } from 'store/actions/products'
import { setStateProductValue } from 'store/reducers/products'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import PageLoading from 'components/PageLoading'
import palette from 'theme/palette'

const ProductCategoryPublishedViewPage = () => {
  const dispatch = useDispatch()
  const lang = useSelector(selectLanguage)
  const [loading, setLoading] = useState(false)
  const { id } = useParams()
  const { pathname } = useLocation()
  const isPublished = pathname.split('/').at(-1) === 'published'
  const { t } = useTranslation()

  const { selectedCategory } = useSelector((state) => state.products)

  useEffect(() => {
    return async () => await dispatch(setLanguage('en'))
  }, [])

  useEffect(async () => {
    if (+id !== 0) {
      setLoading(true)
      const data = await dispatch(fetchCategoryById({ id: isPublished ? `${id}/published` : id }))
      dispatch(setStateProductValue({ type: 'selectedCategory', data: data.payload }))
      setLoading(false)
    }
  }, [lang])

  const initialState = {
    name: selectedCategory.name || '',
    logo: selectedCategory.iconUrl || '',
    mainFields: selectedCategory?.mainFields || [],
    publish: selectedCategory.publish || false
  }

  return (
    <Grid item md={6} xs={12} p={3} sx={{ maxWidth: 900, margin: '0 auto' }}>
      {loading ? (
        <PageLoading loading={loading} />
      ) : (
        <Formik initialValues={initialState} enableReinitialize>
          {({ values, errors }) => (
            <form>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h3" mb={3}>
                  {selectedCategory?.name}
                </Typography>

                {id !== '0' && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ToggleButton
                      sx={{
                        display: 'flex',
                        gap: '8px',
                        overflow: 'auto',
                        marginRight: '10px',
                        flexWrap: 'nowrap',
                        width: 'max-content'
                      }}
                      selected={lang !== 'en'}
                      onChange={() => {
                        dispatch(setLanguage(lang === 'en' ? 'ar' : 'en'))
                      }}
                      value={'check'}>
                      {lang !== 'en' ? 'English' : 'Arabic'}
                    </ToggleButton>
                  </Box>
                )}
              </Box>
              {selectedCategory?.metaInfo && (
                <Typography
                  sx={{ marginBottom: '16px' }}
                  variant="subtitle1"
                  color={palette.variables.darkPurple}>
                  {isPublished
                    ? `Published Version ${selectedCategory?.metaInfo?.publishedVersion}`
                    : `Current Version ${selectedCategory?.metaInfo?.version}`}
                </Typography>
              )}
              <BaseTextField
                InputLabelProps={{ required: false }}
                sx={{ marginBottom: '24px' }}
                margin="normal"
                fullWidth
                id="name"
                label={t('fields.name')}
                name="name"
                disabled
                value={values.name}
                color={!errors.name && values.name ? 'success' : ''}
              />

              <Box sx={{ display: 'flex' }} mb={3}>
                {+id !== 0 && (
                  <img
                    style={{ height: '55px', marginRight: '20px' }}
                    src={selectedCategory.iconUrl}
                    alt=""
                  />
                )}
              </Box>

              {[...Array(6).keys()]?.map((_, index) => (
                <>
                  <BaseTextField
                    InputLabelProps={{ required: false }}
                    sx={{ marginBottom: '24px' }}
                    margin="normal"
                    fullWidth
                    id={`name_${index}`}
                    label={`${t('fields.field')} ${index + 1} ${t('fields.name')}`}
                    name={`name_${index}`}
                    disabled
                    value={values.mainFields[index]?.label}
                    color={
                      !errors.mainFields?.[index]?.label && values.mainFields?.[index]?.label
                        ? 'success'
                        : ''
                    }
                  />
                  <BaseTextarea
                    style={{ marginBottom: '16px' }}
                    label={`${t('fields.field')} ${index + 1} ${t('fields.description')}`}
                    id="text"
                    name={`description_${index}`}
                    value={values.mainFields[index]?.description}
                    placeholder="Add description"
                    disabled
                    color={
                      !errors.mainFields?.[index]?.description &&
                      values.mainFields?.[index]?.description
                        ? 'common.greyLight'
                        : ''
                    }
                  />
                  {values.mainFields.length > 1 && (
                    <FormGroup>
                      <FormControlLabel
                        control={<Checkbox checked={values.mainFields[index]?.preview} disabled />}
                        label={t('fields.usePreviewField')}
                      />
                    </FormGroup>
                  )}
                </>
              ))}
            </form>
          )}
        </Formik>
      )}
    </Grid>
  )
}

export default ProductCategoryPublishedViewPage
