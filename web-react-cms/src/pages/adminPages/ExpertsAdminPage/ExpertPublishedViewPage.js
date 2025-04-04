import React, { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  TextField,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material'
import BaseTextField from 'components/formControl/baseTextField/BaseTextField'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import DescriptionIcon from '@mui/icons-material/Description'
import {
  getExpertById,
  getFaqsByExpert,
  getResoucesByExpert,
  getResoucesByExpertByLang
} from 'store/actions/experts'
import { useDispatch, useSelector } from 'react-redux'
import { Formik } from 'formik'
import { fetchCategorySummary } from 'store/actions/products'
import { useTranslation } from 'react-i18next'
import { selectLanguage, setLanguage } from 'store/app/appSlice'
import palette from 'theme/palette'
import { ContentState, EditorState } from 'draft-js'
import htmlToDraft from 'html-to-draftjs'
import RichTextEditor from 'components/formControl/richTextEditor/RichTextEditor'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'


function ExpertPublishedViewPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const isPublished = pathname.split('/').at(-1).includes('published')
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()
  const {
    expert,
    expertFaqs: faqs,
    expertResources: resources,
    error
  } = useSelector((state) => state.experts)
  const lang = useSelector(selectLanguage)

  const { productCategory } = useSelector((state) => state.products)

  useEffect(() => {
    return async () => await dispatch(setLanguage('en'))
  }, [])

  useEffect(async () => {
    await Promise.all([
      dispatch(getFaqsByExpert({ authorId: id })),
      dispatch(getResoucesByExpert({ authorId: id })),
      dispatch(getResoucesByExpertByLang({ authorId: id, lang: 'AR' }))
      // dispatch(fetchCategory())
    ])

    await dispatch(getExpertById({ id: isPublished ? `${id}/published` : id }))
    await dispatch(fetchCategorySummary({ id: 'published/summary' }))

    if (!!searchParams.get('lang') && searchParams.get('lang') === 'ar') {
      await dispatch(setLanguage('ar'))
    }
    setLoading(false)
  }, [])

  useEffect(async () => {
    if (expert) {
      setLoading(true)
      if (!!searchParams.get('lang') && searchParams.get('lang') === 'ar') {
        await dispatch(setLanguage('ar'))
      }
      await dispatch(getExpertById({ id: isPublished ? `${id}/published` : id }))
      setLoading(false)
    }
  }, [lang])

  const getAnswer = (answer) => {
    const contentBlock = htmlToDraft(`${answer}`)
    if (contentBlock) {
      const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks)
      return EditorState.createWithContent(contentState)
    }
  }


  if (!expert || loading) {
    return <>Loading...</>
  }
  return (
    <>
      <Formik
        initialValues={{
          name: lang === 'ar' && error ? '' : expert.name,
          aboutText: lang === 'ar' && error ? '' : getAnswer(expert.aboutText),
          iconUrl: expert.iconUrl,
          areasOfExpertise: expert.areasOfExpertise,
          publish: expert.publish || false
        }}>
        {({ values }) => (
          <form>
            {expert?.metaInfo && (
              <Typography
                sx={{ marginBottom: '16px' }}
                component="h2"
                variant="h3"
                color={palette.variables.darkPurple}>
                {isPublished
                  ? `Published Version ${expert?.metaInfo?.publishedVersion}`
                  : `Current Version ${expert?.metaInfo?.version}`}
              </Typography>
            )}
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
                  component="img"
                  height="140"
                  image={values.iconUrl}
                  alt="Expert image"
                  sx={{ maxWidth: '250px', borderRadius: 1 }}
                />

                <CardContent style={{ minWidth: '200px' }} sx={{ pt: 0, pl: { xs: 0, sm: 2 } }}>
                  <TextField
                    placeholder="Title"
                    defaultValue={values.name}
                    disabled
                    sx={{ mb: 3, mt: 0 }}
                    id="Name"
                    variant="outlined"
                    name="Name"
                    color={'success'}
                  />
                  <Typography color="common.darkPurple">{t('fields.expert')}</Typography>
                </CardContent>
              </Card>
              {!(searchParams.get('lang') && searchParams.get('lang') === 'ar') && <Box display={'flex'}>
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
              </Box>}
            </Box>
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" component="h3">
                {t('fields.about')}
              </Typography>
              {/* <BaseTextField
                placeholder={t('fields.someText')}
                sx={{ mb: 3, mt: 0 }}
                fullWidth
                disabled
                defaultValue={values.aboutText}
                id="about"
                name="About"
                color={'success'}
              /> */}
              <RichTextEditor
                disabled
                value={values.aboutText}
              />
              <Typography variant="subtitle1" component="h3">
                {t('fields.areaOfExpertise')}
              </Typography>
              <br />
              <Grid item>
                <ToggleButtonGroup
                  disabled
                  sx={{ flexWrap: 'wrap', gap: '7px' }}
                  color="primary"
                  value={values.areasOfExpertise}>
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
                          disabled
                        />
                        <BaseTextField
                          placeholder={t('fields.someText')}
                          fullWidth
                          defaultValue={faq.answer}
                          id="faq_2"
                          label={t('fields.answer')}
                          name="faq_2"
                          disabled
                        />
                      </Box>
                    </Box>
                  )
                }
                return null
              })}

              <Typography variant="subtitle1" sx={{ mt: 3 }} align="center" component="h4">
                <Link
                  to={`/experts/${id}/faq`}
                  state={{ faqs, expert }}
                  style={{ pointerEvents: 'none', opacity: 0.5 }}>
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
                  style={{ pointerEvents: 'none', opacity: 0.5 }}>
                  {t('viewAll')}
                </Link>
              </Typography>
            </Box>
          </form>
        )}
      </Formik>
    </>
  )
}

export default ExpertPublishedViewPage
