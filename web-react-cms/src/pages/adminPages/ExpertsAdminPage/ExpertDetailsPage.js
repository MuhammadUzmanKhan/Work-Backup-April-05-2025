import React, { useEffect, useRef, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Grid,
  TextField,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import DescriptionIcon from '@mui/icons-material/Description'
import {
  deleteExpertById,
  getExpertById,
  getFaqsByExpert,
  getResoucesByExpert,
  getResoucesByExpertByLang,
  updateExpert
} from 'store/actions/experts'
import { useDispatch, useSelector } from 'react-redux'
import { Formik } from 'formik'
import { setImage } from 'store/actions/image'
import { fetchCategorySummary } from 'store/actions/products'
import { setResourceValue } from 'store/reducers/experts'
import { successToast } from 'utils'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import palette from 'theme/palette'
import { useTranslation } from 'react-i18next'
import * as Yup from 'yup'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import { DisablePermissions } from 'components/DisablePermissions'
import ToggleButtonCustom from 'components/formControl/toggleButton/ToggleButton'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'
import { ContentState, EditorState, convertToRaw } from 'draft-js'
import htmlToDraft from 'html-to-draftjs'
import RichTextEditor from 'components/formControl/richTextEditor/RichTextEditor'
import CreatedByModal from 'components/modal/CreatedByModal'
import BaseModel from 'components/modal/BaseModal'
import PageLoading from 'components/PageLoading'
import draftjsToHtml from 'draftjs-to-html'
import { removeSpaces } from 'utils/functions'
import BaseSelect from 'components/formControl/baseSelect/BaseSelect'

function ExpertDetailsPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const {
    expert,
    expertFaqs: faqs,
    expertResources: resources,
    error
  } = useSelector((state) => state.experts)
  const lang = useSelector(selectLanguage)
  const [open, setOpen] = useState(false)
  const { productCategory } = useSelector((state) => state.products)
  const inputFile = useRef(null)
  const [delOpen, setDelOpen] = useState(false)

  const ExpertSchema = Yup.object().shape({
    name: Yup.string().required(t('validation.required')),
    // aboutText: Yup.string().required(t('validation.required')),
    iconUrl: Yup.string().required(t('validation.required'))
  })

  // useEffect(async () => {
  //   if (expert) {
  //     setLoading(true)
  //     // if (!!searchParams.get('lang') && searchParams.get('lang') === 'ar') {
  //     //   await dispatch(setLanguage('ar'))
  //     // }
  //     await dispatch(getExpertById({ id }))
  //     setLoading(false)
  //   }
  // }, [lang])


  useEffect(() => {
    return async () => {
      await dispatch(setLanguage('en'))
      await dispatch(setResourceValue({ type: 'expert', data: null }))
    }
  }, [])

  useEffect(async () => {
    await Promise.all([
      dispatch(getResoucesByExpert({ authorId: id })),
      dispatch(getResoucesByExpertByLang({ authorId: id, lang: 'AR' }))
    ])
    if (!!searchParams.get('lang') && searchParams.get('lang') === 'ar') {
      await dispatch(setLanguage('ar'))
    } else if (!!searchParams.get('lang') && searchParams.get('lang') === 'en') {
      await dispatch(setLanguage('en'))
    }
    await dispatch(getFaqsByExpert({ authorId: id }))
    await dispatch(getExpertById({ id }))
    await dispatch(fetchCategorySummary({ id: 'published/summary' }))
    setLoading(false)
  }, [lang])

  const getAnswer = (answer) => {
    const contentBlock = htmlToDraft(`${answer}`)
    if (contentBlock) {
      const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks)
      return EditorState.createWithContent(contentState)
    }
  }

  const uploadImage = () => {
    inputFile.current.click()
  }

  const onChangeFile = async (event) => {
    event.stopPropagation()
    event.preventDefault()
    var file = event.target.files[0]
    const url = await dispatch(setImage(file))
    return url.payload.url
  }

  const handleDeletion = () => {
    setLoading(true)
    setDelOpen(false)
    dispatch(
      deleteExpertById({
        id,
        cb: () => {
          successToast('Expert has successfully deleted.')
          navigate(-1, { replace: true })
          setLoading(false)
        },
        cbf: () => setLoading(false)
      })
    )
  }

  if (!expert || loading) {
    return <PageLoading loading={loading} />
  }
  return (
    <>
      <PageLoading loading={loading} />
      <Formik
        initialValues={{
          name: error ? '' : expert.name,
          aboutText: error ? EditorState.createEmpty() : getAnswer(expert.aboutText),
          iconUrl: expert.iconUrl,
          areasOfExpertise: expert.areasOfExpertise,
          publish: expert.publish || false
        }}
        validationSchema={ExpertSchema}
        enableReinitialize={true}
        onSubmit={(values) => {
          console.log(draftjsToHtml(convertToRaw(values.aboutText.getCurrentContent())))
          dispatch(
            setResourceValue({
              type: 'expert',
              data: {
                ...values,
                areasOfExpertise: productCategory
                  .filter((x) => values.areasOfExpertise.includes(x.id))
                  .map((y) => ({ id: y.id, name: y.name }))
              }
            })
          )
          !!searchParams.get('lang') && searchParams.get('lang') !== 'ar'
            ? dispatch(
              updateExpert({
                id: lang === 'en' ? id : `${id}/i18n_data`,
                params: {
                  name: values.name,
                  aboutText: `${removeSpaces(draftjsToHtml(convertToRaw(values.aboutText.getCurrentContent())))}`,
                  iconUrl: values.iconUrl,
                  areasOfExpertise: values.areasOfExpertise
                },
                cb: () => {
                  dispatch(getExpertById({ id }))
                  successToast('Expert has Updated')
                }
              })
            )
            : dispatch(
              updateExpert({
                id,
                params: {
                  name: values.name,
                  aboutText: `${removeSpaces(draftjsToHtml(convertToRaw(values.aboutText.getCurrentContent())))}`,
                  iconUrl: values.iconUrl,
                  areasOfExpertise: values.areasOfExpertise
                },
                cb: () => {
                  dispatch(getExpertById({ id }))
                  successToast('Expert has Updated')
                }
              })
            )
        }}>
        {({ values, handleChange, handleSubmit, errors, setFieldValue }) => (
          <form onSubmit={handleSubmit}>
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between'
              }}>
              <Card
                sx={{
                  boxShadow: 0,
                  display: 'flex',
                  alignItems: 'flex-start',
                  flexDirection: { xs: 'column', sm: 'row' }
                }}>
                <CardMedia
                  style={lang === 'en' ? { cursor: 'pointer' } : {}}
                  onClick={() => uploadImage()}
                  component="img"
                  height="140"
                  image={values.iconUrl}
                  alt="Exprot image"
                  sx={{ maxWidth: '250px', borderRadius: 1 }}
                />
                <input
                  accept=".jpg, .png, .jpeg"
                  type="file"
                  id="file"
                  ref={inputFile}
                  style={{ display: 'none' }}
                  onChange={async (event) => {
                    const url = await onChangeFile(event)
                    handleChange({ ...event, target: { name: 'iconUrl', value: url } })
                  }}
                  disabled={lang === 'ar'}
                />

                <CardContent style={{ minWidth: '200px' }} sx={{ pt: 0, pl: { xs: 0, sm: 2 } }}>
                  <TextField
                    placeholder="Title"
                    value={values.name}
                    onChange={(event) => {
                      handleChange({
                        ...event,
                        target: { name: 'name', value: event.target.value }
                      })
                    }}
                    sx={{ mb: 3, mt: 0 }}
                    id="Name"
                    variant="outlined"
                    name="Name"
                    error={!!errors.name}
                    helperText={errors.name}
                    color={!errors.name && values.name ? 'success' : ''}
                  />
                  <Typography color="common.darkPurple">{t('fields.expert')}</Typography>
                </CardContent>
              </Card>
              <Box display={'flex'} flexDirection={'column'}>
                <Box display={'flex'}>
                  <DisablePermissions disable={true} permission={'publish:expert'}>
                    <ToggleButtonCustom
                      text={'Publish'}
                      disabled={expert?.metaInfo?.version === expert?.metaInfo?.publishedVersion}
                      onChange={() => {
                        dispatch(
                          updateExpert({
                            id: `${id}/publish`,
                            cb: () => {
                              dispatch(getExpertById({ id }))
                              successToast('Expert has been published.')
                            }
                          })
                        )
                      }}></ToggleButtonCustom>
                  </DisablePermissions>

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
                      navigate(`/experts/${id}`)
                    }}
                    value={'check'}>
                    {lang !== 'en' ? 'English' : 'Arabic'}
                  </ToggleButton>

                  {(expert?.metaInfo?.publishedVersion || expert?.metaInfo?.lastModifiedBy) && (
                    <>
                      <ToggleButton
                        sx={{
                          display: 'flex',
                          gap: '8px',
                          overflow: 'auto',
                          flexWrap: 'nowrap',
                          width: 'max-content'
                        }}
                        onChange={() => setOpen(true)}>
                        {'Created By'}
                      </ToggleButton>
                      {open && (
                        <CreatedByModal
                          open={open}
                          handleClose={() => setOpen(false)}
                          info={expert?.metaInfo}
                        />
                      )}
                    </>
                  )}
                  <Box
                    sx={{
                      display: 'flex'
                    }}>
                    <IconButton aria-label="delete" onClick={() => setDelOpen(true)}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  </Box>
                </Box>
                <Box display={'flex'} justifyContent={'flex-end'} mt={2} mr={2}>
                  <>
                    {(expert?.metaInfo?.version || expert?.metaInfo?.version === 0) && (
                      <Typography
                        color={palette.variables.orange}
                        variant="caption"
                        style={{ cursor: 'pointer', marginRight: '10px', marginLeft: '10px' }}
                        onClick={() =>
                          navigate(
                            `/experts/published/${id}/current${lang === 'ar' ? '?lang=' + 'ar' : ''
                            }`
                          )
                        }>
                        {`(Current ${expert?.metaInfo?.version})`}
                      </Typography>
                    )}
                    {(expert?.metaInfo?.publishedVersion ||
                      expert?.metaInfo?.publishedVersion === 0) && (
                        <Typography
                          color={palette.variables.orange}
                          variant="caption"
                          style={{ cursor: 'pointer' }}
                          onClick={() =>
                            navigate(
                              `/experts/published/${id}/published${lang === 'ar' ? '?lang=' + 'ar' : ''
                              }`
                            )
                          }>
                          {`(Published ${expert?.metaInfo?.publishedVersion})`}
                        </Typography>
                      )}
                  </>
                </Box>
              </Box>
            </Box>
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" component="h3">
                {t('fields.about')}
              </Typography>
              <RichTextEditor
                value={values.aboutText}
                onChange={(editorState) => setFieldValue("aboutText", editorState)}
              />
              {/* <BaseTextField
                placeholder={t('fields.someText')}
                sx={{ mb: 3, mt: 0 }}
                fullWidth
                onChange={(event) => {
                  handleChange({
                    ...event,
                    target: { name: 'aboutText', value: event.target.value }
                  })
                }}
                defaultValue={values.aboutText}
                id="about"
                name="About"
                error={!!errors.aboutText}
                helperText={errors.aboutText}
                color={!errors.aboutText && values.aboutText ? 'success' : ''}
              /> */}
              <Typography variant="subtitle1" component="h3" mt={2}>
                {t('fields.areaOfExpertise')}
              </Typography>
              <br />
              <Grid item>
                <ToggleButtonGroup
                  // disabled={lang === 'ar'}
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
              <Typography variant="subtitle1" component="h3">
                {t('fields.faqs')}
              </Typography>
              {faqs?.map((faq, index) => {
                if (index < 2) {
                  return (
                    <Box
                      key={faq.id}
                      sx={{ display: 'flex', alignItems: 'flex-start', mt: 3, ml: 2 }}>
                      <Typography variant="subtitle1" component="h4">
                        {index + 1}
                      </Typography>
                      <Box sx={{ ml: 2, width: '100%' }}>
                        <BaseTextField
                          placeholder={t('fields.someText')}
                          defaultValue={faq.question}
                          fullWidth
                          id="faq_1"
                          label={t('fields.question')}
                          name="faq_1"
                          disabled={true}
                        />
                        <RichTextEditor value={getAnswer(faq.answer)} disabled />
                        <BaseSelect
                          name="category"
                          label={t('fields.category')}
                          labelStyle={{ color: '#00000061' }}
                          items={productCategory}
                          initvalue={faq?.categoryId}
                          sx={{ width: '98%', mt: 5, marginEnd: 3 }}
                          disabled={true}
                        />
                      </Box>
                    </Box>
                  )
                }
                return null
              })}

              <Typography variant="subtitle1" sx={{ mt: 3 }} align="center" component="h4">
                <Link
                  to={`/experts/${id}/faq${lang === 'ar' || (!!searchParams.get('lang') && searchParams.get('lang') === 'ar') ? '?lang=ar' : ''}`}
                  state={{ faqs, expert }}
                // style={lang === 'ar' ? { pointerEvents: 'none', opacity: 0.5 } : {}}
                >

                  {t('viewAll')}
                </Link>
              </Typography>
              <Typography sx={{ mt: 3 }} variant="subtitle1" component="h3">
                {t('admin.guidebooks')}
              </Typography>
              {resources?.map((resource, index) => {
                if (index < 3) {
                  return (
                    <Box key={index} sx={{ display: 'flex', mt: 3 }}>
                      <DescriptionIcon />
                      <Typography sx={{ ml: 2 }} variant="subtitle1" component="h4">
                        {resource.name}
                      </Typography>
                    </Box>
                  )
                }
              })}
              <Typography variant="subtitle1" sx={{ mt: 3 }} align="center" component="h4">
                <Link
                  to={`/experts/${id}/guidebook`}
                // style={lang === 'ar' ? { pointerEvents: 'none', opacity: 0.5 } : {}}
                >
                  {t('viewAll')}
                </Link>
              </Typography>
            </Box>
            <DisablePermissions permission={'write:expert'} disable>
              <BaseButton
                customColor={palette.variables.darkPurple}
                type="submit"
                fullWidth
                variant="contained"
                element={t('save')}
                sx={{ display: 'block', maxWidth: 300, marginTop: 10 }}
              />
            </DisablePermissions>
          </form>
        )}
      </Formik>
      <BaseModel
        open={delOpen}
        handleClose={() => setDelOpen(false)}
        text={t('expertDelConfirmation')}
        handleSuccess={handleDeletion}
      />
    </>
  )
}

export default ExpertDetailsPage
