import { InputLabel, ToggleButton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import { Formik } from 'formik'
import React, { useEffect, useState } from 'react'
import palette from 'theme/palette'
import { useTranslation } from 'react-i18next'
import * as Yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { editRewardsTags, getRewardByID, postRewardsTags } from 'store/actions/tag'
import { useNavigate, useParams } from 'react-router-dom'
import { setStateProductValue } from 'store/reducers/products'
import { successToast } from 'utils'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import { LANGUAGE_ERROR } from 'utils/constants'
import { DisablePermissions } from 'components/DisablePermissions'

function TagsCreateRewards() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const lang = useSelector(selectLanguage)
  const [error, setError] = useState()

  useEffect(() => {
    return async () => await dispatch(setLanguage('en'))
  }, [])

  useEffect(async () => {
    if (+id !== 0) {
      const data = await dispatch(getRewardByID({ id }))
      if (data.payload !== LANGUAGE_ERROR)
        dispatch(setStateProductValue({ type: 'tags', data: data }))
      else if (lang === 'ar') setError(LANGUAGE_ERROR)
    }
  }, [lang])

  const { tags } = id ? useSelector((state) => state.products) : ''

  const initialState = {
    name: lang === 'ar' && error ? '' : tags?.payload?.name || ''
  }

  const ProductCreateSchema = Yup.object().shape({
    name: Yup.string().required(t('validation.required'))
  })

  const handleSubmit = (values) => {
    const cb = (res) => {
      successToast(`Tag has ${+id === 0 ? 'created' : 'updated'}`)
      if (+id === 0) navigate(`/tags/rewards/${res.id}`, { replace: true })
    }
    if (+id === 0) {
      dispatch(postRewardsTags({ params: { name: values.name }, cb }))
    } else {
      let obj = {
        id: lang === 'en' ? id : `${id}/i18n_data`,
        params: { name: values.name, language: lang.toUpperCase() },
        cb
      }
      dispatch(editRewardsTags(obj))
    }
  }
  return (
    <>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h3">
          {+id !== 0 ? t('admin.editRewardTag') : t('admin.addRewardTag')}
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
        {({ values, errors, handleChange, handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            <Box sx={{ mt: 5 }}>
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

export default TagsCreateRewards
