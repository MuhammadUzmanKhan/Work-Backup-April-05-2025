import { InputLabel, ToggleButton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import BaseSelect from 'components/formControl/baseSelect/BaseSelect'
import { Formik } from 'formik'
import React, { useEffect, useState } from 'react'
import palette from 'theme/palette'
import { useTranslation } from 'react-i18next'
import * as Yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCategory } from 'store/actions/products'
import { setImage } from 'store/actions/image'
import { editCategoryTags, getCategoryTagsById, postCategoryTags } from 'store/actions/tag'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { setStateProductValue } from 'store/reducers/products'
import { successToast } from 'utils'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import { LANGUAGE_ERROR } from 'utils/constants'
import { DisablePermissions } from 'components/DisablePermissions'
import BaseInput from 'components/formControl/baseInput/BaseInput'


function TagsCreateProduct() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { state } = useLocation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { tags } = id ? useSelector((state) => state.products) : ''
  const { productCategory } = useSelector((state) => state.products)
  const lang = useSelector(selectLanguage)
  const [error, setError] = useState()

  useEffect(() => {
    dispatch(fetchCategory())
    return async () => {
      await dispatch(setLanguage('en'))
      await dispatch(setStateProductValue({ type: 'tags', data: null }))
    }
  }, [])

  useEffect(async () => {
    if (+id !== 0) {
      let categoryId = await dispatch(getCategoryTagsById({ id }))
      if (categoryId.payload !== LANGUAGE_ERROR)
        dispatch(setStateProductValue({ type: 'tags', data: categoryId }))
      else if (lang === 'ar') setError(LANGUAGE_ERROR)
    }
  }, [lang])

  const initialState = {
    name: lang == 'ar' && error ? '' : tags?.payload?.name || '',
    imageThumb: tags?.payload?.iconUrl || '',
    productCategory: state?.categoryId || productCategory?.[0]?.id || '',
    typeTag: '',
    sequence: tags?.payload?.sequence
  }

  const ProductCreateSchema = Yup.object().shape({
    name: Yup.string().required(t('validation.required')),
    imageThumb: Yup.string().required(t('validation.required'))
  })

  const cat = productCategory?.filter((item) => item.id == tags?.payload?.categoryId)

  const handleSubmit = async (values) => {
    const cb = async (res) => {
      successToast(`Tag has ${+id === 0 ? 'created' : 'updated'}`)
      let categoryId = await dispatch(getCategoryTagsById({ id: res.id }))
      dispatch(setStateProductValue({ type: 'tags', data: categoryId }))

      if (+id === 0) navigate(`/tags/product/add/${res.id}`, { replace: true })
    }
    if (+id !== 0) {
      let iconUrl = values.imageThumb
      if (typeof values.imageThumb == 'object') {
        let img = await dispatch(setImage(values.imageThumb))
        iconUrl = img.payload.url
      }
      const obj = {
        id: lang == 'en' ? id : `${id}/i18n_data`,
        params: {
          name: values.name,
          iconUrl: iconUrl,
          categoryId: tags.payload.categoryId,
          language: lang.toUpperCase(),
          sequence: values.sequence ? values.sequence : null
        },
        cb
      }
      dispatch(editCategoryTags(obj))
    } else {
      let iconUrl = await dispatch(setImage(values.imageThumb))

      const obj = {
        name: values.name,
        iconUrl: iconUrl.payload.url,
        categoryId: values.productCategory,
        sequence: values.sequence ? values.sequence : null
      }
      dispatch(postCategoryTags({ params: obj, cb }))
    }
  }
  return (
    <>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h3">
          {+id !== 0 ? t('admin.editProductTag') : t('admin.addProductTag')}
        </Typography>
        {+id !== 0 && (
          <ToggleButton
            sx={{
              display: 'flex',
              gap: '8px',
              overflow: 'auto',
              marginRight: '30px',
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
        )}
      </Box>
      <Formik
        initialValues={initialState}
        enableReinitialize
        validationSchema={ProductCreateSchema}
        onSubmit={handleSubmit}>
        {({ values, errors, handleChange, handleSubmit, setFieldValue }) => (
          <form onSubmit={handleSubmit}>
            <Box sx={{ mt: 3 }}>
              <InputLabel>{t('fields.name')}</InputLabel>
              <BaseTextField
                InputLabelProps={{ required: false }}
                placeholder={t('fields.someText')}
                sx={{ mb: 4, mt: 0 }}
                fullWidth
                id="name"
                name="name"
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                value={values.name}
                color={!errors.name && values.name ? 'success' : ''}
              />

              <InputLabel>{t('fields.logo')}</InputLabel>
              <Box sx={{ display: 'flex' }}>
                {id && (
                  <img
                    style={{ height: '55px', marginRight: '20px' }}
                    src={tags?.payload?.iconUrl}
                    alt=""
                  />
                )}
                <BaseTextField
                  InputLabelProps={{ required: false }}
                  margin="normal"
                  fullWidth
                  name="imageThumb"
                  id="imageThumb"
                  type="file"
                  error={!!errors.imageThumb}
                  onChange={(e) => setFieldValue('imageThumb', e.currentTarget.files[0])}
                  color={!errors.imageThumb && values.imageThumb ? 'success' : ''}
                  sx={{ marginBottom: '30px' }}
                  disabled={lang === 'ar'}
                />
              </Box>
              <InputLabel variant="outlined">
                Sequence
              </InputLabel>
              <BaseInput
                inputProps={{ style: { display: 'block', with: '100%', paddingLeft: 10 }, min: 0 }}
                onChange={handleChange}
                value={values.sequence}
                name="sequence"
                placeholder="Sequence"
                fullWidth
                type="number"
                error={!!errors.sequence}
                helperText={errors.sequence}
                disabled={lang === 'ar'}
                color={!errors.sequence && values.sequence ? 'success' : ''}
              />

              <InputLabel style={{ marginTop: 30 }}>{t('admin.productCategory')}</InputLabel>
              {id ? (
                cat?.[0]?.name
              ) : (
                <BaseSelect
                  name="productCategory"
                  items={productCategory}
                  initvalue={state?.categoryId || productCategory?.[0]?.id}
                  sx={{ width: '100%', marginBottom: 0 }}
                  onChange={(value) => setFieldValue('productCategory', value)}
                />
              )}

              <DisablePermissions permission={'write:tag'} disable>
                <BaseButton
                  customColor={palette.variables.darkPurple}
                  type="submit"
                  fullWidth
                  variant="contained"
                  element={t('save')}
                  sx={{ display: 'block', maxWidth: 300, marginTop: 5 }}
                />
              </DisablePermissions>
            </Box>
          </form>
        )}
      </Formik>
    </>
  )
}

export default TagsCreateProduct
