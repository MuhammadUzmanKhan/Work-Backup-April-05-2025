import { Grid, IconButton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { Box } from '@mui/system'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import palette from 'theme/palette'
import * as Yup from 'yup'
import { Formik } from 'formik'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  createQuizThemes,
  deleteQuizThemesById,
  getQuizThemeActive,
  getQuizThemesById,
  updateQuizThemesById
} from 'store/actions/quizTheme'
import { fetchCategorySummary } from 'store/actions/products'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import { getQizzesTags } from 'store/actions/tag'
import { setImage } from 'store/actions/image'
import { successToast } from 'utils'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import PageLoading from 'components/PageLoading'
import { DisablePermissions } from 'components/DisablePermissions'
import ToggleButtonCustom from 'components/formControl/toggleButton/ToggleButton'
import DeleteIcon from '@mui/icons-material/Delete'
import { setStateQuizThemeValue } from 'store/reducers/quizThemes'
import BaseModel from 'components/modal/BaseModal'

function QuizThemeCreateAdminPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { quizTheme, loading, error } = useSelector((state) => state.quizThemes)
  const { productCategory } = useSelector((state) => state.products)
  const [quizTag, setQuizTag] = useState([])
  const lang = useSelector(selectLanguage)
  const [activated, setActivated] = useState()
  const [delOpen, setDelOpen] = useState(false)

  useEffect(async () => {
    dispatch(fetchCategorySummary({ id: 'summary' }))
    const res = await dispatch(getQizzesTags())
    if (res.payload) setQuizTag(res.payload.reverse())
  }, [])

  useEffect(() => {
    return async () => {
      await dispatch(setLanguage('en'))
      await dispatch(setStateQuizThemeValue({ type: 'quizTheme', data: null }))
    }
  }, [])

  useEffect(async () => {
    if (+id !== 0) {
      const active = await dispatch(getQuizThemeActive({ id: 'latest' }))
      if (active.payload) setActivated(active.payload)
      dispatch(getQuizThemesById({ id }))
    } else {
      await dispatch(setStateQuizThemeValue({ type: 'quizTheme', data: null }))
    }
  }, [lang])

  const initialState = {
    name: error && lang === 'ar' ? '' : quizTheme?.name || '',
    iconUrl: quizTheme?.iconUrl || '',
    imageUrl: quizTheme?.imageUrl || '',
    categoryIds: quizTheme?.categoryIds || [],
    quizTagIds: quizTheme?.quizTagIds || []
  }

  const QuizThemeCreateSchema = Yup.object().shape({
    name: Yup.string().required(t('validation.required')),
    iconUrl: Yup.string().required(t('validation.required')),
    imageUrl: Yup.string().required(t('validation.required')),
    // categoryIds: Yup.array().min(1, t('validation.required')),
    quizTagIds: Yup.array().min(1, t('validation.required'))
  })

  const handleSubmit = async (values) => {
    let convertedIcon
    if (values.iconUrl !== quizTheme?.iconUrl) {
      convertedIcon = await dispatch(setImage(values.iconUrl))
    }
    let convertedImage
    if (values.imageUrl !== quizTheme?.imageUrl) {
      convertedImage = await dispatch(setImage(values.imageUrl))
    }

    const _quizTheme = {
      id: lang === 'en' ? id : `${id}/i18n_data`,
      params: {
        name: values.name,
        imageUrl: convertedImage?.payload.url || values.imageUrl,
        iconUrl: convertedIcon?.payload.url || values.iconUrl,
        // categoryIds: values.categoryIds,
        quizTagIds: values.quizTagIds
      },
      cb: (res) => {
        successToast(`Quiz Theme has ${t + id === 0 ? 'created' : 'updated'}`)
        if (+id === 0) {
          navigate(`/quiz-theme/${res.id}`, { replace: true })
        } else {
          dispatch(getQuizThemesById({ id }))
        }
      }
    }
    if (values.categoryIds?.length) {
      _quizTheme.params['categoryIds'] = values.categoryIds
    }

    try {
      if (+id === 0) {
        await dispatch(createQuizThemes(_quizTheme))
      } else {
        await dispatch(updateQuizThemesById(_quizTheme))
      }
    } catch (e) {
      console.error(e.message)
    }
  }

  const handleDeletion = () => {
    setDelOpen(false)
    dispatch(
      deleteQuizThemesById({
        id,
        cb: async () => {
          successToast('Quiz Theme has successfully deleted.')
          navigate(-1, { replace: true })
        }
      })
    )
  }
  console.log(quizTheme?.metaInfo)
  return (
    <Box>
      <PageLoading loading={loading} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h3">
            {+id === 0 ? 'Add New Quiz Theme' : 'Edit Quiz Theme'}
          </Typography>
        </Box>
        {+id !== 0 && (
          <Box display={'flex'} flexDirection={'column'}>
            <Box display={'flex'}>
              <DisablePermissions disable={true} permission={'publish:quizTheme'}>
                <ToggleButtonCustom
                  text={activated?.id === id ? 'Activated' : 'Activate'}
                  disabled={activated?.id === id}
                  // disabled={quizTheme?.metaInfo?.version === quizTheme?.metaInfo?.publishedVersion}
                  onChange={() => {
                    dispatch(
                      updateQuizThemesById({
                        id: `${id}/publish`,
                        cb: async () => {
                          const active = await dispatch(getQuizThemesById({ id: 'latest' }))
                          if (active.payload) setActivated(active.payload)
                          dispatch(getQuizThemesById({ id }))
                          successToast('Quiz theme has been activated.')
                        }
                      })
                    )
                  }}></ToggleButtonCustom>
              </DisablePermissions>

              {quizTheme?.metaInfo?.version !== quizTheme?.metaInfo?.publishedVersion && activated?.id === id &&
                <ToggleButtonCustom
                  text={'Re-Activate'}
                  onChange={() => {
                    dispatch(
                      updateQuizThemesById({
                        id: `${id}/publish`,
                        cb: async () => {
                          dispatch(getQuizThemesById({ id }))
                          successToast('Quiz theme has been activated.')
                        }
                      })
                    )
                  }}>
                </ToggleButtonCustom>
              }

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

              <Box
                sx={{
                  display: 'flex'
                }}>
                <IconButton aria-label="delete" onClick={() => setDelOpen(true)}>
                  <DeleteIcon color="error" />
                </IconButton>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      <PageLoading loading={loading} />
      <Formik
        initialValues={initialState}
        validationSchema={QuizThemeCreateSchema}
        enableReinitialize
        onSubmit={handleSubmit}>
        {({ values, errors, handleChange, handleSubmit, setFieldValue }) => (
          <form onSubmit={handleSubmit}>
            <Box component="div">
              <BaseTextField
                InputLabelProps={{ required: false }}
                sx={{ marginBottom: '24px' }}
                margin="normal"
                fullWidth
                id="name"
                label={t('fields.name')}
                name="name"
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                value={values.name}
                color={!errors.name && values.name ? 'success' : ''}
              />

              <Box sx={{ display: 'flex', ml: 0 }}>
                {(+id !== 0 || typeof values.iconUrl === 'object') && (
                  <img
                    style={{ height: '55px', marginRight: '20px', marginLeft: '16px' }}
                    src={
                      quizTheme?.iconUrl ||
                      (typeof values.iconUrl === 'object' && URL.createObjectURL(values.iconUrl))
                    }
                    alt=""
                  />
                )}
                <BaseTextField
                  InputLabelProps={{ required: false }}
                  margin="normal"
                  fullWidth
                  name="iconUrl"
                  label={`${t('fields.icon')}  (.jpeg, .jpg, .png)`}
                  id="iconUrl"
                  type="file"
                  error={!!errors.iconUrl}
                  helperText={errors.iconUrl}
                  onChange={(e) => setFieldValue('iconUrl', e.currentTarget.files[0])}
                  file={values.iconUrl}
                  color={!errors.iconUrl && values.iconUrl ? 'success' : ''}
                  sx={{ marginBottom: '30px' }}
                  disabled={lang === 'ar'}
                />
              </Box>

              <Box sx={{ display: 'flex', ml: 0 }}>
                {(+id !== 0 || typeof values.imageUrl === 'object') && (
                  <img
                    style={{ height: '55px', marginRight: '20px', marginLeft: '16px' }}
                    src={
                      quizTheme?.imageUrl ||
                      (typeof values.imageUrl === 'object' && URL.createObjectURL(values.imageUrl))
                    }
                    alt=""
                  />
                )}
                <BaseTextField
                  InputLabelProps={{ required: false }}
                  margin="normal"
                  fullWidth
                  name="imageUrl"
                  label={`${t('fields.image')}  (.jpeg, .jpg, .png)`}
                  id="imageUrl"
                  type="file"
                  error={!!errors.imageUrl}
                  helperText={errors.imageUrl}
                  onChange={(e) => setFieldValue('imageUrl', e.currentTarget.files[0])}
                  file={values.imageUrl}
                  color={!errors.imageUrl && values.imageUrl ? 'success' : ''}
                  sx={{ marginBottom: '30px' }}
                  disabled={lang === 'ar'}
                />
              </Box>

              <Grid container spacing={2} mt={1}>
                <Grid item xs={8} sx={{ display: 'flex' }}>
                  <LocalOfferIcon />
                  <Typography
                    sx={{ ml: 2 }}
                    variant="body2"
                    color={'common.darkPurple'}
                    style={{ fontWeight: 500 }}>
                    {t('admin.productCategory')}
                  </Typography>
                </Grid>

                <Grid item>
                  <ToggleButtonGroup
                    disabled={lang === 'ar'}
                    sx={{ flexWrap: 'wrap', gap: '7px' }}
                    color="primary"
                    value={values.categoryIds}
                    onChange={(e, newValues) => {
                      setFieldValue('categoryIds', newValues)
                    }}>
                    {productCategory?.map((cat) => (
                      <ToggleButton
                        sx={{
                          display: 'flex',
                          gap: '8px',
                          overflow: 'auto',
                          marginBottom: '15px',
                          flexWrap: 'nowrap',
                          width: 'max-content'
                        }}
                        selected={values.categoryIds.includes(cat.id)}
                        key={cat.id}
                        value={cat.id}>
                        {cat.name}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Grid>
              </Grid>
              {errors.categoryIds && (
                <Typography variant="subtitle1" color="common.error">
                  {errors.categoryIds}
                </Typography>
              )}
              <Grid container spacing={2} mt={1}>
                <Grid item xs={8} sx={{ display: 'flex' }}>
                  <LocalOfferIcon />
                  <Typography
                    sx={{ ml: 2 }}
                    variant="body2"
                    color={'common.darkPurple'}
                    style={{ fontWeight: 500 }}>
                    {t('admin.quizTags')}
                  </Typography>
                </Grid>

                <Grid item>
                  <ToggleButtonGroup
                    disabled={lang === 'ar'}
                    sx={{ flexWrap: 'wrap', gap: '7px' }}
                    color="primary"
                    value={values.quizTagIds}
                    onChange={(e, newValues) => {
                      setFieldValue('quizTagIds', newValues)
                    }}>
                    {quizTag?.map((tag) => (
                      <ToggleButton
                        sx={{
                          display: 'flex',
                          gap: '8px',
                          overflow: 'auto',
                          marginBottom: '15px',
                          flexWrap: 'nowrap',
                          width: 'max-content'
                        }}
                        selected={values.quizTagIds.includes(tag.id)}
                        key={tag.id}
                        value={tag.id}>
                        {tag.name}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Grid>
              </Grid>
              {errors.quizTagIds && (
                <Typography variant="subtitle1" color="common.error">
                  {errors.quizTagIds}
                </Typography>
              )}
              <DisablePermissions permission={'write:quizTheme'} disable>
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

      <BaseModel
        open={delOpen}
        handleClose={() => setDelOpen(false)}
        text={t('delConfirmation')}
        handleSuccess={handleDeletion}
      />
    </Box>
  )
}

export default QuizThemeCreateAdminPage
