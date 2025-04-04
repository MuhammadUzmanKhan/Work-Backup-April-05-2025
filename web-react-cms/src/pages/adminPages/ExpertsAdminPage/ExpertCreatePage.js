import React, { useEffect } from 'react';
import { Box, Typography, Grid, ToggleButtonGroup, ToggleButton } from '@mui/material'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import { Formik } from 'formik'
import palette from 'theme/palette'
import { useTranslation } from 'react-i18next'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import * as Yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { setImage } from 'store/actions/image'
import { createExpert } from 'store/actions/experts'
import { fetchCategorySummary } from 'store/actions/products'
import { successToast } from 'utils'
import { useNavigate } from 'react-router-dom'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import RichTextEditor from 'components/formControl/richTextEditor/RichTextEditor'
import { convertToRaw, EditorState } from 'draft-js'
import draftjsToHtml from 'draftjs-to-html'
import { removeSpaces } from 'utils/functions'

function ExpertCreatePage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { productCategory } = useSelector((state) => state.products)
  const lang = useSelector(selectLanguage)

  useEffect(() => {
    dispatch(fetchCategorySummary({ id: 'published/summary' }))
    return async () => await dispatch(setLanguage('en'))
  }, [])

  const initialState = {
    name: '',
    imageThumb: '',
    about: EditorState.createEmpty(),
    areasOfExpertise: [],
    file: ['', '', '', '']
  }

  const { t } = useTranslation()

  const ExpertSchema = Yup.object().shape({
    name: Yup.string().required(t('validation.required')),
    // about: Yup.string().required(t('validation.required')),
    imageThumb: Yup.string().required(t('validation.required'))
  })

  const handleSubmit = async (values) => {
    let iconUrl = await dispatch(setImage(values.imageThumb))
    const value = {
      name: values.name,
      aboutText: removeSpaces(draftjsToHtml(convertToRaw(values.about.getCurrentContent()))),
      iconUrl: iconUrl.payload.url,
      areasOfExpertise: values.areasOfExpertise
    }

    dispatch(
      createExpert({
        params: value,
        cb: (res) => {
          successToast('Expert has created')
          navigate(`/experts/${res.id}${lang === 'ar' ? '?lang=' + 'ar' : ''}`, {
            replace: true
          })
        }
      })
    )
  }
  return (
    <>
      <Formik initialValues={initialState} validationSchema={ExpertSchema} onSubmit={handleSubmit}>
        {({ values, errors, handleChange, handleSubmit, setFieldValue, setErrors }) => (
          <form onSubmit={handleSubmit}>
            <Box display={'flex'} justifyContent={'flex-end'}>
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
                  setErrors({})
                }}
                value={'check'}>
                {lang !== 'en' ? 'English' : 'Arabic'}
              </ToggleButton>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography style={{ fontWeight: 500 }} variant="body2" color={'common.darkPurple'}>
                Name
              </Typography>
              <BaseTextField
                InputLabelProps={{ required: false }}
                placeholder={t('fields.someText')}
                sx={{ mb: 3, mt: 0 }}
                fullWidth
                id="name"
                name="name"
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                value={values.name}
                color={!errors.name && values.name ? 'success' : ''}
              />

              <Typography style={{ fontWeight: 500 }} variant="body2" color={'common.darkPurple'}>
                Logo
              </Typography>
              <BaseTextField
                InputLabelProps={{ required: false }}
                margin="normal"
                fullWidth
                name="imageThumb"
                id="imageThumb"
                type="file"
                error={!!errors.imageThumb}
                helperText={errors.imageThumb}
                onChange={(e) => setFieldValue('imageThumb', e.currentTarget.files[0])}
                color={!errors.imageThumb && values.imageThumb ? 'success' : ''}
                sx={{ marginBottom: '30px' }}
              />
              <Typography style={{ fontWeight: 500 }} variant="body2" color={'common.darkPurple'}>
                About
              </Typography>
              <RichTextEditor
                value={values.about}
                onChange={(editorState) => setFieldValue("about", editorState)}
              />
              {/* <BaseTextField
                placeholder={t('fields.someText')}
                sx={{ mb: 3, mt: 0 }}
                fullWidth
                id="about"
                name="about"
                onChange={handleChange}
                error={!!errors.about}
                helperText={errors.about}
                value={values.about}
              /> */}
              <Typography style={{ fontWeight: 500, marginTop: 20 }} variant="body2" color={'common.darkPurple'}>
                Area of expertise
              </Typography>
              <br />
              <Grid item>
                <ToggleButtonGroup
                  sx={{ flexWrap: 'wrap', gap: '7px' }}
                  color="primary"
                  value={values.areasOfExpertise}
                  onChange={(event, value) => {
                    handleChange({
                      ...event,
                      target: { name: 'areasOfExpertise', value }
                    })
                  }}>
                  {productCategory.map((cat) => (
                    <ToggleButton
                      sx={{
                        display: 'flex',
                        gap: '8px',
                        overflow: 'auto',
                        marginBottom: '15px',
                        flexWrap: 'nowrap',
                        width: 'max-content'
                      }}
                      selected={values.areasOfExpertise.includes(cat.id)}
                      key={cat.id}
                      value={cat.id}>
                      {cat.name}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Grid>

              <BaseButton
                customColor={palette.variables.darkPurple}
                type="submit"
                fullWidth
                variant="contained"
                element={t('save')}
                sx={{ display: 'block', maxWidth: 300, marginTop: 5 }}
              />
            </Box>
          </form>
        )}
      </Formik>
    </>
  )
}

export default ExpertCreatePage;
