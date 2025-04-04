import { Box, Grid, IconButton, ImageListItem, ToggleButton, Typography } from '@mui/material'
import React, { useEffect, useState, useRef } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import BaseSelect from 'components/formControl/baseSelect/BaseSelect'
import { useDispatch, useSelector } from 'react-redux'
import { convertToRaw, EditorState } from 'draft-js'
import draftToHtml from 'draftjs-to-html'
import Paper from '@mui/material/Paper'
import { styled } from '@mui/material/styles'
import { setImage } from 'store/actions/image'
import { getExperts } from 'store/actions/experts'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import { Formik } from 'formik'
import { createResource } from 'store/actions/resources'
import { useLocation, useNavigate } from 'react-router-dom'
import { deleteFuncToast, successToast } from 'utils'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import palette from 'theme/palette'
import { useTranslation } from 'react-i18next'
import * as Yup from 'yup'
import RichTextEditor from 'components/formControl/richTextEditor/RichTextEditor'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import { removeSpaces } from 'utils/functions'
import { fetchCategory } from 'store/actions/products'

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  cursor: 'pointer',
  color: theme.palette.text.secondary
}))

function ResourcesDetailsPage() {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [previewText, setPreviewText] = useState(EditorState.createEmpty())
  const { productCategory: categories } = useSelector((state) => state.products)

  const [fullText, setFullText] = useState(EditorState.createEmpty())
  const [selectedFile, setSeletectedFile] = useState('')
  const inputFile = useRef(null)
  const { experts } = useSelector((state) => state.experts)
  const lang = useSelector(selectLanguage)

  useEffect(() => {
    dispatch(getExperts())
    return async () => await dispatch(setLanguage('en'))
  }, [])

  useEffect(() => {
    dispatch(fetchCategory())
  }, [])

  const uploadImage = (fileName) => {
    setSeletectedFile(fileName)
    inputFile.current.click()
  }

  const onChangeFile = async (event) => {
    event.stopPropagation()
    event.preventDefault()
    var file = event.target.files[0]
    const url = await dispatch(setImage(file))
    return url.payload.url
  }
  const ResourceSchema = Yup.object().shape({
    name: Yup.string().required(t('validation.required'))
  })

  return (
    <>
      <Formik
        initialValues={{
          name: '',
          authorId: state?.expertId || '',
          categoryId: '',
          iconUrl: 'https://daleel-assets.s3.me-south-1.amazonaws.com/6/220621115853add_(1).png',
          imageUrl: 'https://daleel-assets.s3.me-south-1.amazonaws.com/6/220621115853add_(1).png'
        }}
        validationSchema={ResourceSchema}
        onSubmit={(values) => {
          dispatch(
            createResource({
              params: {
                ...values,
                previewText: removeSpaces(
                  draftToHtml(convertToRaw(previewText.getCurrentContent()))
                ),
                fullText: removeSpaces(draftToHtml(convertToRaw(fullText.getCurrentContent())))
              },
              cb: (response) => {
                successToast('Resource has created')
                navigate(`/resources/${response.id}${lang === 'ar' ? "?lang=ar" : ''}`, { replace: true })
              }
            })
          )
        }}>
        {({
          values,
          handleChange,
          handleSubmit,
          errors,
          setErrors,
          setFieldValue
          /* and other goodies */
        }) => (
          <form onSubmit={handleSubmit}>
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                mb: 6
              }}>
              <BaseTextField
                name="name"
                label={t('fields.title')}
                id="name"
                fullWidth
                value={values.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                color={!errors.name && values.name ? 'success' : ''}
              />

              <ToggleButton
                sx={{
                  display: 'flex',
                  gap: '8px',
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
              <Box
                sx={{
                  display: 'flex'
                }}>
                <IconButton aria-label="delete" onClick={() => deleteFuncToast()}>
                  <DeleteIcon color="error" />
                </IconButton>
              </Box>
            </Box>
            <Box>
              <Grid container spacing={2} style={{ marginBottom: '2rem' }}>
                <Grid item xs={2}>
                  <Item onClick={() => uploadImage('iconUrl')}>
                    <h4>{t('fields.thumbnail')}</h4>
                    <ImageListItem key={values.iconUrl} style={{ height: '200px' }}>
                      <img
                        src={`${values.iconUrl}?w=164&h=164&fit=crop&auto=format`}
                        srcSet={`${values.iconUrl}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
                        alt={'iconUrl'}
                        loading="lazy"
                      />
                    </ImageListItem>
                  </Item>
                </Grid>

                <Grid item xs={2}>
                  <Item onClick={() => uploadImage('imageUrl')}>
                    <h4>{t('fields.fullsizeImage')}</h4>
                    <ImageListItem key={values.imageUrl} style={{ height: '200px' }}>
                      <img
                        src={`${values.imageUrl}?w=164&h=164&fit=crop&auto=format`}
                        srcSet={`${values.imageUrl}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
                        alt={'imageUrl'}
                        loading="lazy"
                      />
                    </ImageListItem>
                  </Item>
                </Grid>
                <input
                  type="file"
                  id="file"
                  ref={inputFile}
                  style={{ display: 'none' }}
                  onChange={async (event) => {
                    const url = await onChangeFile(event)
                    handleChange({ ...event, target: { name: selectedFile, value: url } })
                  }}
                />
              </Grid>

              <BaseSelect
                name="authorName"
                label={t('fields.authorName')}
                items={experts.map((x) => ({
                  id: x.id,
                  title: x.name
                }))}
                placeholder="expert"
                initvalue={values?.authorId}
                onChange={(value, event) => {
                  handleChange({
                    ...event,
                    target: { name: 'authorId', value }
                  })
                }}
                sx={{ width: '100%', marginBottom: 0, ml: 0 }}
              />
              <BaseSelect
                name="categoryId"
                label={t('fields.category')}
                items={categories}
                sx={{ width: '100%', marginBottom: 0, ml: 0, mt: 5 }}
                onChange={(value) => {
                  setFieldValue(`categoryId`, value)
                }}
              />
              <Typography
                style={{ fontWeight: 500 }}
                variant="body2"
                color={'common.darkPurple'}
                sx={{ mt: 3 }}>
                {t('fields.previewText')}
              </Typography>
              <RichTextEditor
                value={previewText}
                onChange={(editorState) => setPreviewText(editorState)}
              />
              <Typography
                style={{ fontWeight: 500 }}
                variant="body2"
                color={'common.darkPurple'}
                sx={{ mt: 3 }}>
                {t('fields.about')}
              </Typography>
              <RichTextEditor
                value={fullText}
                onChange={(editorState) => setFullText(editorState)}
              />

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

export default ResourcesDetailsPage
