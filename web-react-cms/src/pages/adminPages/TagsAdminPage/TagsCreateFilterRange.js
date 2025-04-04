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
import { editFilterTags, getFilterTagsById, postFilterTags } from 'store/actions/tag'
import { useNavigate, useParams } from 'react-router-dom'
import { setStateProductValue } from 'store/reducers/products'
import { failureToast, successToast } from 'utils'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import { LANGUAGE_ERROR } from 'utils/constants'
import { DisablePermissions } from 'components/DisablePermissions'
import { NumToString, StringToNum } from 'utils/functions'

function TagsCreateFilterRange() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { id } = useParams()
  const navigate = useNavigate()
  const [state, setstate] = useState(1)
  const [type, setType] = useState()
  const { tags } = id ? useSelector((state) => state.products) : ''
  const lang = useSelector(selectLanguage)
  const [error, setError] = useState()

  useEffect(() => {
    return async () => await dispatch(setLanguage('en'))
  }, [])

  const initialState = {
    name: lang == 'ar' && error ? '' : tags?.payload?.value || '',
    productCategory: '',
    typeTag:
      lang === 'ar' && type ? type : typeof tags?.payload?.lowerValue !== 'undefined' ? 2 : 1,
    lowest:
      lang == 'ar' && error
        ? ''
        : typeof tags?.payload?.lowerValue !== 'undefined'
        ? NumToString(tags?.payload?.lowerValue)
        : '',
    highest:
      lang == 'ar' && error
        ? ''
        : typeof tags?.payload?.higherValue !== 'undefined'
        ? NumToString(tags?.payload?.higherValue)
        : '',
    sufix: lang == 'ar' && error ? '' : tags?.payload?.valueSuffix || ''
  }

  const ProductCreateSchema = Yup.object().shape({
    // name: Yup.string().required(t('validation.required'))
    name: Yup.string().when('typeTag', {
      is: () => state === 1,
      then: Yup.string().required(t('validation.required'))
    }),
    lowest: Yup.string().when('typeTag', {
      is: () => state === 2,
      then: Yup.string().required(t('validation.required'))
    }),
    highest: Yup.string().when('typeTag', {
      is: () => state === 2,
      then: Yup.string().required(t('validation.required'))
    })
  })

  const typeSelect = [
    { id: 1, value: 1, name: 'Text Based' },
    { id: 2, value: 2, name: 'Range' }
  ]

  useEffect(async () => {
    if (+id !== 0) {
      const data = await dispatch(getFilterTagsById({ id }))
      if (data.payload !== LANGUAGE_ERROR)
        dispatch(setStateProductValue({ type: 'tags', data: data }))
      else if (lang === 'ar') setError(LANGUAGE_ERROR)
    }
  }, [lang])

  useEffect(() => {
    const _type = typeof tags?.payload?.lowerValue !== 'undefined' ? 2 : 1
    if (lang === 'ar' && type !== _type) setstate(type)
    else setstate(_type)
    if (lang === 'en') {
      const type = typeof tags?.payload?.lowerValue !== 'undefined' ? 2 : 1
      setType(type)
    }
  }, [tags])

  const handleSubmit = (values) => {
    let data = {}
    if (state == 2 || (lang === 'ar' && type === 2)) {
      if (StringToNum(values.highest) < StringToNum(values.lowest)) {
        failureToast('Highest range must be greater than or equal to lowest range.')
        return
      }
      data[`valueSuffix`] = values.sufix
      data[`lowerValue`] = StringToNum(values.lowest)
      data[`higherValue`] = StringToNum(values.highest)
    } else {
      data[`value`] = values.name
    }

    const cb = (res) => {
      successToast(`Tag has ${+id === 0 ? 'created' : 'updated'}`)
      if (+id === 0) navigate(`/tags/filter/${res.id}`, { replace: true })
    }
    if (+id === 0) {
      dispatch(postFilterTags({ params: data, cb }))
    } else {
      const obj = {
        id: lang === 'en' ? id : `${id}/i18n_data`,
        params: { ...data, language: lang.toUpperCase() },
        cb
      }
      dispatch(editFilterTags(obj))
    }
  }

  const customSelect = (value) => {
    setstate(value)
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
            <Box sx={{ mt: 5 }}>
              {!(state === 2 || (type === 2 && lang === 'ar')) && (
                <>
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
                </>
              )}
              <InputLabel>{t('fields.type')}</InputLabel>
              <BaseSelect
                name="typeTag"
                items={typeSelect}
                initvalue={state}
                sx={{ width: '100%', marginBottom: 0 }}
                onChange={(value) => customSelect(value)}
                disabled={lang === 'ar'}
              />

              {(state === 2 || (type === 2 && lang === 'ar')) && (
                <>
                  <InputLabel sx={{ mt: 5 }}>{t('fields.lowestValue')}</InputLabel>
                  <BaseTextField
                    InputLabelProps={{ required: false }}
                    placeholder={t('fields.someText')}
                    sx={{ mb: 4, mt: 0 }}
                    fullWidth
                    id="lowest"
                    name="lowest"
                    onChange={(e) =>
                      setFieldValue(
                        'lowest',
                        StringToNum(e.target.value) ? StringToNum(e.target.value) : ''
                      )
                    }
                    value={NumToString(values.lowest)}
                    error={!!errors.lowest}
                    helperText={errors.lowest}
                  />

                  <InputLabel>{t('fields.highestValue')}</InputLabel>
                  <BaseTextField
                    InputLabelProps={{ required: false }}
                    placeholder={t('fields.someText')}
                    sx={{ mb: 4, mt: 0 }}
                    fullWidth
                    id="highest"
                    name="highest"
                    onChange={(e) =>
                      setFieldValue(
                        'highest',
                        StringToNum(e.target.value) ? StringToNum(e.target.value) : ''
                      )
                    }
                    value={NumToString(values.highest)}
                    error={!!errors.highest}
                    helperText={errors.highest}
                  />
                  <InputLabel>{t('fields.valueSuffix')}</InputLabel>
                  <BaseTextField
                    InputLabelProps={{ required: false }}
                    placeholder={t('fields.someText')}
                    sx={{ mb: 4, mt: 0 }}
                    fullWidth
                    id="sufix"
                    name="sufix"
                    onChange={handleChange}
                    value={values.sufix}
                  />
                </>
              )}

              {/* <InputLabel sx={{ mt: 6 }}>Product category</InputLabel> */}
              {/* <ToggleButtonGroup
                sx={{ flexWrap: 'wrap', gap: '7px' }}
                color="primary"
                value={tags}
                onChange={(e, newValues) => {
                  setTags(newValues);
                  setFieldValue('tags', newValues);
                }}>
                {category.map((product) => (
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
                    value={product}>
                    {product.name}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup> */}
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

export default TagsCreateFilterRange
